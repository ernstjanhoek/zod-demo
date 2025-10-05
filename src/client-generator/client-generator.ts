import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { z, ZodLiteral, ZodNever, ZodObject, ZodTypeAny } from 'zod';

type EndpointDef = {
  method: z.ZodLiteral<string>;
  path: z.ZodLiteral<string>;
  requestFormat: z.ZodLiteral<string>;
  parameters?: z.AnyZodObject;
  responses: z.AnyZodObject;
};

type EndpointMap = Record<string, EndpointDef>;

type SuccessKeys<R extends z.AnyZodObject> = Extract<
  keyof R['shape'],
  `2${string}`
>;

type ResponseType<E extends EndpointDef> =
  E['responses'] extends z.AnyZodObject
    ? z.infer<E['responses']['shape'][SuccessKeys<E['responses']>]>
    : never;

// Extracts parameters
type InferParameters<T> =
  T extends { parameters: infer P }
    ? P extends ZodObject<any> ? z.infer<P>
    : P extends ZodNever ? never
    : never
  : never;


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
    const path = literalValue(ep.path);
   
    const method = literalValue(ep.method).toLowerCase();

    const responses = ep.responses.shape;
    const successKey = Object.keys(responses).find((s) => s.startsWith('2'));
    const schema: ZodTypeAny = successKey ? responses[successKey] : responses;

    (client as any)[name] = (parameters: any): Observable<any> => {
/*       const $request = http.request(method, path, {
        body: parameters.body
      }); */
      const req$ = 
      (http as any)[method](path);
      return schema
        ? req$.pipe(map((res: any) => schema.parse(res)))
        : req$;
    };
  }

  return client as Client<T>;
}

function literalValue<TValue>(lit: ZodLiteral<TValue>): TValue {
  return lit._def.value;
}