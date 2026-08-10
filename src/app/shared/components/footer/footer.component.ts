import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { PublicSiteService } from '../../../core/services/public-site.service';
import { PublicSite } from '../../../core/models/public-site.model';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent implements OnInit {
  currentYear = new Date().getFullYear();

  site: PublicSite | null = null;

  constructor(private publicSiteService: PublicSiteService) {}

  ngOnInit(): void {
    this.publicSiteService.publicSite$.subscribe((site) => {
      this.site = site;
    });
  }

  get logoUrl(): string {
    if (!this.site?.logoUrl) return '';

    if (this.site.logoUrl.startsWith('http')) return this.site.logoUrl;

    return `${environment.apiUrl.replace('/api', '')}${this.site.logoUrl}`;
  }

  get fullAddress(): string {
    if (!this.site) return '';

    return [
      this.site.address,
      this.site.village,
      this.site.taluka,
      this.site.district,
      this.site.state,
      this.site.pincode,
    ]
      .filter(Boolean)
      .join(', ');
  }
}
