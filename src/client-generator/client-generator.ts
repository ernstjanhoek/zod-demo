import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, map } from "rxjs";
import { z } from "zod";

// ---- types for endpoint definitions ----
type EndpointDef = {
  method: z.ZodLiteral<string>;
  path: z.ZodLiteral<string>;
  requestFormat: z.ZodLiteral<string>;
  parameters: z.AnyZodObject | z.ZodNever;
  responses: z.AnyZodObject;
};

type EndpointMap = Record<string, EndpointDef>;

// infer the response type from the endpoint
type ResponseType<E extends EndpointDef> =
  E["responses"] extends z.AnyZodObject
    ? {
        [K in keyof E["responses"]["shape"]]: z.infer<
          E["responses"]["shape"][K]
        >;
      }[keyof E["responses"]["shape"]]
    : unknown;

// ---- client builder ----
export function buildClient<T extends EndpointMap>(endpoints: T) {
  const http = inject(HttpClient);

  const client: any = {};

  for (const [name, ep] of Object.entries(endpoints)) {
    const path = (ep.path as any)._def.value as string;
    const method = (ep.method as any)._def.value.toLowerCase();

    // pick first 2xx response schema
    const responses = ep.responses.shape;
    const successKey = Object.keys(responses).find((s) => s.startsWith("2"));
    const schema = successKey ? responses[successKey] : undefined;

    client[name] = (...args: any[]): Observable<any> => {
      const req$ = (http as any)[method](path);

      return schema
        ? req$.pipe(map((res: any) => (schema as z.ZodTypeAny).parse(res)))
        : req$;
    };
  }

  return client as {
    [K in keyof T]: () => Observable<ResponseType<T[K]>>;
  };
}
