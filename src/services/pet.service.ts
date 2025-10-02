import { Injectable } from "@angular/core";
import { buildClient } from "../client-generator/client-generator";
import z from "zod";

// --- your zod schemas ---
export const Pet = z.object({
  id: z.number(),
  name: z.string(),
});

export type get_GetPetCustom = typeof get_GetPetCustom;
export const get_GetPetCustom = {
  method: z.literal("GET"),
  path: z.literal("/pet/custom"),
  requestFormat: z.literal("json"),
  parameters: z.never(),
  responses: z.object({
    "200": Pet,
  }),
};

// --- build client ---
const zodVerifiedPetClient = buildClient({
  getCustomPets: get_GetPetCustom,
});

// --- in an Angular service ---
@Injectable({ providedIn: "root" })
export class PetService {
  client = zodVerifiedPetClient;

  // usage
  loadPets() {
    return this.client.getCustomPets(); // Observable<{ id: number, name: string }>
  }
}
