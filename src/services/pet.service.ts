import { inject, Injectable } from "@angular/core";
import { buildClient } from "../client-generator/client-generator";
import z from "zod";
import { HttpClient } from "@angular/common/http";

// --- your zod schemas ---
export const Pet = z.object({
  id: z.number(),
  name: z.string(),
});
export type Pet = z.infer<typeof Pet>;

export const Error = z.object({
  message: z.string(),
});
export type Error = z.infer<typeof Error>;

export const get_GetPetCustom = {
  method: z.literal("GET"),
  path: z.literal("http://localhost:3000/pet/custom"),
  requestFormat: z.literal("json"),
  responses: z.object({
    "200": Pet,
    "400": Error
  }),
} as const;

export const post_PostPetCustom = {
  method: z.literal("PUT"),
  path: z.literal("http://localhost:3000/pet/custom/{id}"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    body: Pet,        // the request body
    path: z.object({     // optional path parameters if needed
      id: z.number()
    }),
  }),
  responses: z.object({
    "200": Pet,
    "400": Error
  }),
} as const;

@Injectable({ providedIn: "root" })
export class PetService {
  private client = buildClient(
    inject(HttpClient),
    { 
      loadPets: get_GetPetCustom,
      editPet: post_PostPetCustom,
     },
  );

  public loadPets = this.client.loadPets; // expose alleen de methodes uit de client voor readability
  public editPet = this.client.editPet;
}
