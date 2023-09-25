import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { secureInnerPagesGuard } from './secure-inner-pages.guard';

describe('secureInnerPagesGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => secureInnerPagesGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
