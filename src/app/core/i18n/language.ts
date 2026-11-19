import { Injectable, Pipe, PipeTransform, inject, signal } from '@angular/core';
import { formatDate, registerLocaleData } from '@angular/common';
import marathiLocale from '@angular/common/locales/mr';
import translations from './mr.json';

registerLocaleData(marathiLocale, 'mr-IN');
export type AppLanguage = 'en' | 'mr';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly storageKey = 'farmstay_language';
  private readonly selected = signal<AppLanguage>(this.readPreference());
  readonly language = this.selected.asReadonly();
  private readonly marathi = new Map(Object.entries(translations).map(([key, value]) => [this.normalize(key), value]));

  constructor() { document.documentElement.lang = this.selected(); }

  setLanguage(language: AppLanguage): void {
    this.selected.set(language);
    document.documentElement.lang = language;
    try { localStorage.setItem(this.storageKey, language); } catch { /* Language selection still works when storage is unavailable. */ }
  }

  translate(value: unknown, params?: Record<string, unknown>): string {
    if (value === null || value === undefined) return '';
    const original = String(value);
    let text = this.selected() === 'mr' ? this.marathi.get(this.normalize(original)) ?? original : original;
    if (this.selected() === 'mr' && text === original) {
      text = text.replace(/^(January|February|March|April|May|June|July|August|September|October|November|December)( \d{4})$/, (_match, month: string, year: string) =>
        (this.marathi.get(this.normalize(month)) ?? month) + year);
    }
    return text.replace(/\{(p\d+)\}/g, (placeholder, key: string) =>
      params && Object.prototype.hasOwnProperty.call(params, key) ? String(params[key] ?? '') : placeholder);
  }

  get locale(): string { return this.selected() === 'mr' ? 'mr-IN' : 'en-IN'; }

  private normalize(value: string): string { return value.replace(/\s+/g, ' ').trim().toLowerCase(); }

  private readPreference(): AppLanguage {
    try { return localStorage.getItem(this.storageKey) === 'mr' ? 'mr' : 'en'; } catch { return 'en'; }
  }
}

@Pipe({ name: 't', standalone: true, pure: false })
export class TranslationPipe implements PipeTransform {
  private readonly language = inject(LanguageService);
  transform(value: unknown, params?: Record<string, unknown>): string {
    return this.language.translate(value, params);
  }
}

@Pipe({ name: 'localDate', standalone: true, pure: false })
export class LocalDatePipe implements PipeTransform {
  private readonly language = inject(LanguageService);
  transform(value: string | number | Date | null | undefined, format = 'mediumDate', timezone?: string): string | null {
    if (value === null || value === undefined || value === '') return null;
    return formatDate(value, format, this.language.locale, timezone);
  }
}
