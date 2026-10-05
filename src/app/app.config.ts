import {
  ApplicationConfig,
  provideZoneChangeDetection,
  provideAppInitializer,
  inject,
} from '@angular/core';

import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { loaderInterceptor } from './core/interceptors/loader.interceptor';
import { PublicSiteService } from './core/services/public-site.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({
      eventCoalescing: true,
    }),

    provideRouter(routes),

    provideHttpClient(withInterceptors([authInterceptor, loaderInterceptor])),

    provideAnimations(),
    provideToastr(),

    // Load Public Site Configuration at Application Startup
    provideAppInitializer(() => {
      const publicSiteService = inject(PublicSiteService);
      return firstValueFrom(publicSiteService.loadSite());
    }),
  ],
};
