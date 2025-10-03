import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { z } from 'zod';

type EndpointDef = {
  method: z.ZodLiteral<string>;
  path: z.ZodLiteral<string>;
  requestFormat: z.ZodLiteral<string>;
  parameters: z.AnyZodObject | z.ZodNever;
  responses: z.AnyZodObject;
};

type EndpointMap = Record<string, EndpointDef>;

type SuccessKeys<R extends z.AnyZodObject> = Extract<keyof R['shape'], `${number}`> extends infer K
  ? K extends `2${string}` ? K : never
  : never;

type ResponseType<E extends EndpointDef> =
  E['responses'] extends z.AnyZodObject
    ? z.infer<E['responses']['shape'][SuccessKeys<E['responses']>]>
    : unknown;
    
export function buildClient<T extends EndpointMap>(
  http: HttpClient,
  endpoints: T,
) {
  const client: any = {};

  for (const [name, ep] of Object.entries(endpoints)) {
    const path = (ep.path as any)._def.value as string;
    const method = (ep.method as any)._def.value.toLowerCase();

    const responses = ep.responses.shape;
    const successKey = Object.keys(responses).find((s) => s.startsWith('2'));
    const schema = successKey ? responses[successKey] : undefined;

    client[name] = (): Observable<any> => {
      const req$ = (http as any)[method](path);
      return schema
        ? req$.pipe(map((res: any) => (schema as z.ZodTypeAny).parse(res)))
        : req$;
    };
  }

  return client as { [K in keyof T]: () => Observable<ResponseType<T[K]>> };
}