import { TestBed } from '@angular/core/testing';
import { CanMatchFn } from '@angular/router';

import { canLoadAuthGuard } from './can-load-auth.guard';

describe('canLoadAuthGuard', () => {
  const executeGuard: CanMatchFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => canLoadAuthGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
