import { TranslationPipe, LanguageService } from '../../../core/i18n/language';
import { inject as injectLanguage } from '@angular/core';
import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { TokenService } from '../../../core/services/token.service';
import { PublicSiteService } from '../../../core/services/public-site.service';

import { PublicSite } from '../../../core/models/public-site.model';
import { isAdministrationRole } from '../../../core/models/administration-role';

import { environment } from '../../../../environments/environment';

import { ThemeSwitcherComponent } from'../../theme-switcher/theme-switcher.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [TranslationPipe, CommonModule, RouterLink, RouterLinkActive,ThemeSwitcherComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  readonly language = injectLanguage(LanguageService);
  readonly isAdministrationRole = isAdministrationRole;
  get currentUser$() {
    return this.tokenService.currentUser$;
  }

  site: PublicSite | null = null;

  isDropdownOpen = false;
  isNavigationOpen = false;


  constructor(
    private tokenService: TokenService,
    private router: Router,
    private publicSiteService: PublicSiteService,
  ) {}

  ngOnInit(): void {
    // Public Site Information
    this.publicSiteService.publicSite$.subscribe((site) => {
      this.site = site;
    });
  }

  /**
   * Full Logo URL
   */
  get logoUrl(): string {
    if (!this.site?.logoUrl) return '';

    if (this.site.logoUrl.startsWith('http')) return this.site.logoUrl;

    return `${environment.apiUrl.replace('/api', '')}${this.site.logoUrl}`;
  }

  /**
   * Dropdown
   */
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeNavigationOnLink(event: Event): void {
    if ((event.target as HTMLElement).closest('a')) this.isNavigationOpen = false;
  }
  @HostListener('document:keydown.escape')
  closeNavigation(): void { this.isNavigationOpen = false; this.closeDropdown(); }
  @HostListener('window:resize')
  onViewportResize(): void { if (window.innerWidth >= 1200) this.isNavigationOpen = false; }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  /**
   * Logout
   */
  logout(): void {
    this.closeDropdown();

    this.tokenService.logout();

    this.router.navigate(['/home']);
  }

  /**
   * Close dropdown when clicking outside
   */
  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeDropdown();
  }

  /**
   * Prevent dropdown close
   */
  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}
