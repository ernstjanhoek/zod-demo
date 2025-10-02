import { TestBed } from "@angular/core/testing";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { buildClient } from "../client-generator/client-generator";
import { z } from "zod";
import { Observable } from "rxjs";

// Mock schema
const Pet = z.object({
  id: z.number(),
  name: z.string(),
});

export type Pet = z.infer<typeof Pet>;

const get_GetPetCustom = {
  method: z.literal("GET"),
  path: z.literal("/pet/custom"),
  requestFormat: z.literal("json"),
  parameters: z.never(),
  responses: z.object({
    "200": Pet,
  }),
};

describe("buildClient", () => {
  let httpMock: HttpTestingController;

  // Our generated client
  let client: {
    getCustomPets: () => Observable<Pet>;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    httpMock = TestBed.inject(HttpTestingController);

    client = buildClient({
      getCustomPets: get_GetPetCustom,
    });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should fetch and validate pets", (done) => {
    client.getCustomPets().subscribe((pet) => {
      expect(pet).toEqual({ id: 1, name: "Fido" });
      done();
    });

    const req = httpMock.expectOne("/pet/custom");
    expect(req.request.method).toBe("GET");

    // Respond with valid data
    req.flush({ id: 1, name: "Fido" });
  });

  it("should throw if response is invalid", (done) => {
    client.getCustomPets().subscribe({
      next: () => fail("Expected validation error"),
      error: (err: any) => {
        expect(err).toBeInstanceOf(Error); // Zod validation error
        done();
      },
    });

    const req = httpMock.expectOne("/pet/custom");
    req.flush({ wrongField: "oops" }); // invalid response
  });
});
