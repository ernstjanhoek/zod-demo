import { Component, inject } from '@angular/core';
import { Error, PetService } from '../services/pet.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'zod-test';
  petService = inject(PetService);

  somePet = toSignal(this.petService.loadPets({path: 'huisdierIdx' }).pipe(catchError((error: HttpErrorResponse) => {
    console.log('httpErrorResponse', error);
    return of();
  })));

  someOtherPet = toSignal(this.petService.loadPets({ path: 'huisdierIdx2' }).pipe(catchError((error: Error) => {
    console.log('error met eigen errorType', error);
    return of();
  })));
}
