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
    // Respond with invalid data
    req.flush({ wrongField: 'oops' });
  });
});