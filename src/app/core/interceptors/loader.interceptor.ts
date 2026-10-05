
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoaderService } from '../services/loader.service';

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(LoaderService);

  // Start loader tracking when an API request begins
  loaderService.startRequest();

  return next(req).pipe(
    // Finish tracking whether the request succeeds, fails, or is cancelled
    finalize(() => {
      loaderService.finishRequest();
    })
  );
};