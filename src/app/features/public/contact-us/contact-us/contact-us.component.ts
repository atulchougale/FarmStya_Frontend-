import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { PublicSiteService } from '../../../../core/services/public-site.service';
import { PublicSite } from '../../../../core/models/public-site.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.css',
})
export class ContactUsComponent implements OnInit, OnDestroy {
  contactForm: FormGroup;

  submitting = false;
  contactInfo: PublicSite | null = null;
  loading = true;
  errorMessage = '';

  mapSafeUrl: SafeResourceUrl | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly publicSiteService: PublicSiteService,
    private readonly sanitizer: DomSanitizer,
  ) {
    this.contactForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.maxLength(100)]],
      mobileNo: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      message: ['', [Validators.required, Validators.maxLength(1000)]],
    });
  }

  // Form Controls
  get f() {
    return this.contactForm.controls;
  }

  // WhatsApp number: keep only digits
  get whatsappNumber(): string {
    return (this.contactInfo?.mobileNumber ?? '').replace(/\D/g, '');
  }

  // Component Initialization
  ngOnInit(): void {
    this.loadContactInfo();
  }

  // Submit Contact Form
  onSubmit(): void {
    if (this.contactForm.invalid || this.submitting) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const farmHouseId = this.publicSiteService.currentFarmHouseId;

    if (farmHouseId === null || farmHouseId === undefined) {
      Swal.fire({
        title: 'Error',
        text: 'Farm house information is missing. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545',
      });
      return;
    }

    this.submitting = true;

    const dto = {
      ContactId: 0,
      FarmHouseId: farmHouseId,
      ...this.contactForm.value,
    };

    this.publicSiteService
      .saveContactData(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.submitting = false;

          if (response?.success === false) {
            Swal.fire({
              title: 'Failed',
              text: response?.message || 'Unable to send the message.',
              icon: 'error',
              confirmButtonText: 'OK',
              confirmButtonColor: '#dc3545',
            });
            return;
          }

          Swal.fire({
            title: 'Message Sent',
            text: 'Your message has been sent successfully.',
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#198754',
          });

          this.contactForm.reset();
        },
        error: (error) => {
          this.submitting = false;

          console.error('Failed to send message:', error);

          Swal.fire({
            title: 'Error',
            text:
              error?.error?.message ||
              'Something went wrong. Please try again.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#dc3545',
          });
        },
      });
  }

  // Load Contact Information
  loadContactInfo(): void {
    this.loading = true;
    this.errorMessage = '';
    this.mapSafeUrl = null;

    this.publicSiteService
      .getContactInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response?.success && response.data) {
            this.contactInfo = response.data;
            this.setMapUrl(response.data.googleMapUrl);
          } else {
            this.contactInfo = null;
            this.mapSafeUrl = null;
            this.errorMessage =
              response?.message || 'Contact information is unavailable.';
          }

          this.loading = false;

          console.log('Contact Information API Response:', response);
        },
        error: (error) => {
          console.error('Error loading contact information:', error);

          this.contactInfo = null;
          this.mapSafeUrl = null;
          this.errorMessage =
            'Unable to load contact information. Please try again later.';
          this.loading = false;
        },
      });
  }

  // Validate Google Maps URL before trusting it for iframe usage
  // private setMapUrl(url?: string | null): void {
  //   this.mapSafeUrl = null;

  //   if (!url?.trim()) {
  //     return;
  //   }

  //   try {
  //     const parsedUrl = new URL(url);

  //     const isGoogleMapsEmbedUrl =
  //       parsedUrl.protocol === 'https:' &&
  //       parsedUrl.hostname === 'www.google.com' &&
  //       parsedUrl.pathname.startsWith('/maps/embed');

  //     if (isGoogleMapsEmbedUrl) {
  //       this.mapSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  //     } else {
  //       console.warn('Google Maps URL is not a supported embed URL.');
  //     }
  //   } catch {
  //     console.warn('Invalid Google Maps URL provided.');
  //   }
  // }

  private setMapUrl(url?: string | null): void {
    this.mapSafeUrl = null;

    if (!url?.trim()) {
      return;
    }

    try {
      const inputUrl = url.trim();
      const parsedUrl = new URL(inputUrl);

      // Allow only HTTPS Google Maps domains
      const allowedHosts = [
        'google.com',
        'www.google.com',
        'maps.google.com',
        'maps.google.co.in',
        'www.google.co.in',
        'goo.gl',
        'maps.app.goo.gl',
      ];

      const hostname = parsedUrl.hostname.toLowerCase();

      const isAllowedHost = allowedHosts.includes(hostname);

      if (parsedUrl.protocol !== 'https:' || !isAllowedHost) {
        console.warn('Unsupported Google Maps URL:', inputUrl);
        return;
      }

      // Case 1: Google Maps embed URL
      if (
        (hostname === 'www.google.com' || hostname === 'google.com') &&
        parsedUrl.pathname.startsWith('/maps/embed')
      ) {
        this.mapSafeUrl =
          this.sanitizer.bypassSecurityTrustResourceUrl(inputUrl);
        return;
      }

      // Case 2: Google Maps search URL, e.g. ?q=16.7050,74.2433
      const query =
        parsedUrl.searchParams.get('q') || parsedUrl.searchParams.get('query');

      if (query) {
        const coordinateMatch = query.match(
          /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/,
        );

        if (coordinateMatch) {
          const lat = Number(coordinateMatch[1]);
          const lng = Number(coordinateMatch[2]);

          if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            const embedUrl = `https://www.google.com/maps?q=${lat},${lng}&output=embed`;

            this.mapSafeUrl =
              this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
            return;
          }
        }

        // Place name or address search
        const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

        this.mapSafeUrl =
          this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
        return;
      }

      // Case 3: Coordinates in /maps/@lat,lng,zoom
      const coordinatePathMatch = parsedUrl.pathname.match(
        /\/maps\/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,|\/|$)/,
      );

      if (coordinatePathMatch) {
        const lat = Number(coordinatePathMatch[1]);
        const lng = Number(coordinatePathMatch[2]);

        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          const embedUrl = `https://www.google.com/maps?q=${lat},${lng}&output=embed`;

          this.mapSafeUrl =
            this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
          return;
        }
      }

      // Case 4: Google Maps place or search paths
      if (
        parsedUrl.pathname.startsWith('/maps/place/') ||
        parsedUrl.pathname.startsWith('/maps/search/')
      ) {
        const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(inputUrl)}&output=embed`;

        this.mapSafeUrl =
          this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
        return;
      }

      // Case 5: Other Google Maps URLs
      // Use the URL as a search query in the embedded map
      const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(inputUrl)}&output=embed`;

      this.mapSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    } catch {
      console.warn('Invalid Google Maps URL:', url);
      this.mapSafeUrl = null;
    }
  }

  // Cleanup subscriptions
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
