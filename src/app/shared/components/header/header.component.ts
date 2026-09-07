import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { TokenService } from '../../../core/services/token.service';
import { PublicSiteService } from '../../../core/services/public-site.service';

import { LoginResponse } from '../../../features/auth/models/login-response.model';
import { PublicSite } from '../../../core/models/public-site.model';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  isLoggedIn = false;

  currentUser: LoginResponse | null = null;

  site: PublicSite | null = null;

  isDropdownOpen = false;

  constructor(
    private tokenService: TokenService,
    private router: Router,
    private publicSiteService: PublicSiteService,
  ) {}

  ngOnInit(): void {
    // Authentication Status
    this.tokenService.isLoggedIn$.subscribe((status) => {
      this.isLoggedIn = status;
    });

    // Logged In User
    this.tokenService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

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
