import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { TokenService } from '../services/token.service';
import { PublicSiteService } from '../services/public-site.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const publicSiteService = inject(PublicSiteService);

  const accessToken = tokenService.getAccessToken();
  const farmHouseId = publicSiteService.currentFarmHouseId;

  const headers: Record<string, string> = {};

  // Add Authorization header when Access Token is available
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Add FarmHouseId header when FarmHouse context is available
  if (farmHouseId !== null) {
    headers['FarmHouseId'] = farmHouseId.toString();
  }

  // No headers to add
  if (Object.keys(headers).length === 0) {
    return next(req);
  }

  const authRequest = req.clone({
    setHeaders: headers,
  });

  return next(authRequest);
};
