import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PetService } from './pet.service';

describe('PetService', () => {
  let service: PetService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PetService],
    });

    service = TestBed.inject(PetService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch and validate pets', (done) => {
    service.loadPets().subscribe((pet) => {
      expect(pet).toEqual({ id: 1, name: 'Fido' });
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/pet/custom');
    expect(req.request.method).toBe('GET');

    // Respond with valid data
    req.flush({ id: 1, name: 'Fido' });
  });

  it('should throw if response is invalid', (done) => {
    service.loadPets().subscribe({
      next: () => fail('Expected validation error'),
      error: (err) => {
        expect(err).toBeInstanceOf(Error); // Zod validation error
        done();
      },
    });

    const req = httpMock.expectOne('http://localhost:3000/pet/custom');
    expect(req.request.method).toBe('GET');

    // Respond with invalid data (missing required fields)
    req.flush({ wrongField: 'oops' });
  });

  it('should edit a pet successfully', (done) => {
    const params = {
      path: { id: 1},
      body: { id: 1, name: 'Fluffy' },
    };

    const expectedResponse = { id: 1, name: 'Fluffy' };

    service.editPet(params).subscribe((res) => {
      expect(res).toEqual(expectedResponse);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/pet/custom/{id}'); // assuming URL template
    expect(req.request.method).toBe('PUT'); // or 'PUT' if that’s your method
    expect(req.request.body).toEqual(params.body);

    req.flush(expectedResponse);
  });

  it('should throw if the response is invalid', (done) => {
    const params = {
      path: { id: 1 },
      body: { id: 1, name: 'Fluffy' },
    };

    service.editPet(params).subscribe({
      next: () => fail('Expected validation error'),
      error: (err) => {
        // Zod will throw a validation error if the response does not match schema
        expect(err).toBeInstanceOf(Error);
        done();
      },
    });

    const req = httpMock.expectOne('http://localhost:3000/pet/custom/{id}');

    // Respond with invalid data (missing required fields)
    req.flush({ wrongField: 'oops' });
  });
});