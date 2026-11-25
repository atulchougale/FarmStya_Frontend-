
import { Component, OnInit, inject } from '@angular/core';
import { ThemeService, FarmStayBrand } from '../../core/services/theme.service';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  template: `
    <div
      class="fst-theme-switcher"
      role="group"
      aria-label="Choose brand theme">

      <button
        type="button"
        [class.active]="activeTheme === 'orange'"
        [attr.aria-pressed]="activeTheme === 'orange'"
        (click)="select('orange')">

        <span class="swatch orange" aria-hidden="true"></span>
        Orange
      </button>

      <button
        type="button"
        [class.active]="activeTheme === 'blue'"
        [attr.aria-pressed]="activeTheme === 'blue'"
        (click)="select('blue')">

        <span class="swatch blue" aria-hidden="true"></span>
        Blue
      </button>

    </div>
  `,
  styles: [`
    .fst-theme-switcher {
      display: inline-flex;
      gap: 6px;
      padding: 4px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: var(--surface);
    }

    button {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 7px 12px;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: var(--text-body);
      font-family: inherit;
      font-size: 13px;
      font-weight: 500;
      line-height: 1.2;
      cursor: pointer;
      transition: background 0.2s ease, color 0.2s ease;
    }

    button.active {
      background: var(--primary-50);
      color: var(--primary-800);
    }

    .swatch {
      width: 11px;
      height: 11px;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
    }

    .orange {
      background: #F47716;
    }

    .blue {
      background: #4778E8;
    }

    button:focus-visible {
      outline: 3px solid var(--focus-ring);
      outline-offset: 2px;
    }

    @media (prefers-reduced-motion: reduce) {
      button {
        transition: none;
      }
    }
  `],
})
export class ThemeSwitcherComponent implements OnInit {
  private readonly themeService = inject(ThemeService);

  activeTheme: FarmStayBrand = 'orange';

  ngOnInit(): void {
    this.activeTheme = this.themeService.getBrand();
  }

  select(theme: FarmStayBrand): void {
    if (this.activeTheme === theme) {
      return;
    }

    this.themeService.setBrand(theme);
    this.activeTheme = theme;
  }
}
