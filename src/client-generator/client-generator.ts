import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { AnyZodObject, z, ZodLiteral, ZodNever, ZodTypeAny } from 'zod';

/**
 * API-endpoint definitie, die overeenkomt met de structuur van OpenAPI.
 * 
 * - `method`: HTTP-methode van de endpoint (GET, POST, etc.) als Zod literal.
 * - `path`: URL pad van de endpoint als Zod literal.
 * - `requestFormat`: Verwacht request-formaat (bijv. "json") als Zod literal.
 * - `parameters`: Optioneel object met parameters voor de endpoint (body, path, query, headers), gevalideerd met Zod.
 * - `responses`: Object met mogelijke HTTP-responses (statuscodes als keys) en bijbehorende Zod-schema's.
 */
type EndpointDef = {
  method: z.ZodLiteral<string>;
  path: z.ZodLiteral<string>;
  requestFormat: z.ZodLiteral<string>;
  parameters?: z.AnyZodObject;
  responses: z.AnyZodObject;
};

/**
 * Map van endpoints voor een API-client.
 * Keys zijn de gewenste methode namen in de client.
 * Values zijn de bijbehorende EndpointDef objecten.
 */
type EndpointMap = Record<string, EndpointDef>;

/**
* Haalt de 'succes'-statuscode keys op uit een ZodObject R.
* keyof R['shape'] geeft alle keys van het ZodObject.
* Extract<..., `2${string}`> filtert alleen de keys die beginnen met '2', bv. 200, 201, etc.
*/
type SuccessKeys<R extends z.AnyZodObject> = Extract<
  keyof R['shape'],
  `2${string}`
>;

/**
* Haalt het response type op voor een EndpointDef E.
* E['responses'] moet een ZodObject zijn.
* SuccessKeys<E['responses']> selecteert de 'succes'-statuscodes (200, 201, etc.).
* z.infer<...> haalt het TypeScript type van dat succes-response schema.
*/
type ResponseType<E extends EndpointDef> =
  E['responses'] extends z.AnyZodObject
    ? z.infer<E['responses']['shape'][SuccessKeys<E['responses']>]>
    : never;

/**
* Controleert of T een EndpointDef is met een parameters-veld.
* Als P een AnyZodObject is, wordt de parameterstructuur van T geëxtraheerd met z.infer<P>.
* Als P ZodNever is, betekent dit dat er geen parameters zijn, en wordt 'never' geretourneerd.
*/    
type InferParameters<T> =
  T extends { parameters: infer P }
    ? P extends AnyZodObject ? z.infer<P>
    : P extends ZodNever ? never
    : never
  : never;

/** 
 * Type van een gegenereerd Client-object.
 * Het client-object wordt opgebouwd uit een EndpointMap (TEndpoints extends EndpointMap).
 * Voor iedere key (K) in de EndpointMap wordt een functie aangemaakt:
 *  - Als de endpoint geen parameters heeft, heeft de functie geen argumenten.
 *  - Als de endpoint wel parameters heeft, krijgt de functie één parameter object met de juiste type.
 * De functie retourneert altijd een Observable van het 200-response type van de endpoint.
 */
type Client<TEndpoints extends EndpointMap> = {
  [K in keyof TEndpoints]:
    InferParameters<TEndpoints[K]> extends never
      ? () => Observable<ResponseType<TEndpoints[K]>>
      : (params: InferParameters<TEndpoints[K]>) => Observable<ResponseType<TEndpoints[K]>>;
};

export function buildClient<T extends EndpointMap>(
  http: HttpClient,
  endpoints: T,
) {
  const client: Partial<Client<T>> = {};
  for (const [name, ep] of Object.entries(endpoints)) {
    const method = literalValue(ep.method).toLowerCase();

    const path = literalValue(ep.path);

    const responses = ep.responses.shape;
    
    const successKey = Object.keys(responses).find((s) => s.startsWith('2'));
    const schema: ZodTypeAny = successKey ? responses[successKey] : responses;

    const parameterSchema = ep.parameters?.shape;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any)[name] = (parameters?: z.infer<typeof parameterSchema>): Observable<z.infer<typeof schema>> => {
      const body = parameters && 'body' in parameters ? parameters.body : undefined;

      const req$ = http.request(method, path, {
        body: body,
        params: parameters?.query,
        headers: parameters?.header,
      });

      return schema
        ? req$.pipe(
          map((res: z.input<typeof schema>) => schema.parse(res))
        ) as Observable<z.infer<typeof schema>>
        : req$;
    };
  }

  return client as Client<T>;
}

function literalValue<TValue>(lit: ZodLiteral<TValue>): TValue {
  return lit._def.value;
}