import { CanActivateFn } from '@angular/router';
import { TestBed, async, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import { SecureInnerPagesGuard } from './secure-inner-pages.guard';

describe('SecureInnerPagesGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SecureInnerPagesGuard],
      imports: [RouterTestingModule]
    });
  });

  it('checks if a user is valid',

    // inject your guard service AND Router
    async(inject([SecureInnerPagesGuard, Router], (auth: { canActivate: () => any; }, router: { navigate: any; }) => {

      // add a spy
      spyOn(router, 'navigate');

      expect(auth.canActivate()).toBeFalsy();
      expect(router.navigate).toHaveBeenCalled();
    })
  ));
});
