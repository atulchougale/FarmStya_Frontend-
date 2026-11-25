
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

export type FarmStayBrand = 'orange' | 'blue';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'farmstay-brand-theme';
  private readonly defaultTheme: FarmStayBrand = 'orange';

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {}

  initialize(): void {
    let theme: FarmStayBrand = this.defaultTheme;

    if (isPlatformBrowser(this.platformId)) {
      try {
        const saved = window.localStorage.getItem(this.storageKey);

        if (saved === 'orange' || saved === 'blue') {
          theme = saved;
        }
      } catch {
        // Use default Orange theme when storage is unavailable.
      }
    }

    this.apply(theme, false);
  }

  setBrand(theme: FarmStayBrand): void {
    this.apply(theme, true);
  }

  getBrand(): FarmStayBrand {
    return this.document.documentElement.getAttribute('data-theme') === 'blue'
      ? 'blue'
      : 'orange';
  }

  private apply(theme: FarmStayBrand, persist: boolean): void {
    this.document.documentElement.setAttribute('data-theme', theme);

    if (persist && isPlatformBrowser(this.platformId)) {
      try {
        window.localStorage.setItem(this.storageKey, theme);
      } catch {
        // Theme remains applied for the current session.
      }
    }
  }
}
