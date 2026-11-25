import { TranslationPipe, LanguageService } from '../../../../core/i18n/language';
import { inject as injectLanguage } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  imports: [TranslationPipe, CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.css',
})
export class ContactUsComponent implements OnInit, OnDestroy {
  readonly language = injectLanguage(LanguageService);
  contactForm: FormGroup;
  readonly enquiryTypes = ['Stay enquiry', 'Event enquiry', 'General question', 'Other'];
  readonly heroImage = '/assets/images/contact/farmhouse-veranda.png';
  get fullAddress(): string {
    const parts: string[] = [];
    for (const part of [this.contactInfo?.address, this.contactInfo?.village, this.contactInfo?.taluka, this.contactInfo?.district, this.contactInfo?.state, this.contactInfo?.pincode]) {
      const text = part?.trim();
      if (text && !parts.join(', ').toLowerCase().includes(text.toLowerCase())) parts.push(text);
    }
    return parts.join(', ');
  }
  get locationLabel(): string { return [...new Set([this.contactInfo?.taluka, this.contactInfo?.district, this.contactInfo?.state].filter(Boolean))].join(', '); }
  private get locationQuery(): string {
    const lat = this.contactInfo?.latitude, lng = this.contactInfo?.longitude;
    return typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
      ? `${lat},${lng}` : [this.contactInfo?.farmHouseName, this.fullAddress].filter(Boolean).join(', ');
  }
  get mapsUrl(): string { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(this.locationQuery); }
  get directionsUrl(): string { return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(this.locationQuery); }
  readonly messageLimit = 1000;


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
      fullName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
      mobileNo: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.email, Validators.maxLength(254)]],
      enquiryType: ['', Validators.required],
      message: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(1000)]],
    });

  }

  // Form Controls
  get f() {
    return this.contactForm.controls;
  }

  // WhatsApp number: keep only digits
  get whatsappNumber(): string {
    const digits = (this.contactInfo?.mobileNumber ?? '').replace(/\D/g, '');
    return digits.length === 10 ? '91' + digits : digits;
  }

  // Component Initialization
  ngOnInit(): void {
    this.loadContactInfo();
  }

  // Submit Contact Form
  onSubmit(): void {
    if (this.submitting) return;
    if ((this.contactForm.value.message?.trim()?.length ?? 0) > this.messageLimit) {
      this.contactForm.get('message')?.setErrors({ maxlength: true });
    }
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const farmHouseId = this.publicSiteService.currentFarmHouseId;

    if (farmHouseId === null || farmHouseId === undefined) {
      Swal.fire({
        title: this.language.translate('Error'),
        text: this.language.translate('Farm house information is missing. Please try again.'),
        icon: 'error',
        confirmButtonText: this.language.translate('OK'),
        confirmButtonColor: '#dc3545',
      });
      return;
    }

    this.submitting = true;

    const dto = {
      ContactId: 0,
      FarmHouseId: farmHouseId,
      FullName: this.contactForm.value.fullName.trim(),
      MobileNo: this.contactForm.value.mobileNo.trim(),
      Email: this.contactForm.value.email?.trim() || null,
      EnquiryType: this.contactForm.value.enquiryType,
      Message: this.contactForm.value.message.trim(),
    };

    this.publicSiteService
      .saveContactData(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.submitting = false;

          if (response?.success === false) {
            Swal.fire({
              title: this.language.translate('Failed'),
              text: this.language.translate(response?.message || 'Unable to send the message.'),
              icon: 'error',
              confirmButtonText: this.language.translate('OK'),
              confirmButtonColor: '#dc3545',
            });
            return;
          }

          Swal.fire({
            title: this.language.translate('Message Sent'),
            text: this.language.translate('Your message has been sent successfully.'),
            icon: 'success',
            confirmButtonText: this.language.translate('OK'),
            confirmButtonColor: '#198754',
          });

          this.contactForm.reset();
        },
        error: (error) => {
          this.submitting = false;

          console.error('Failed to send message:', error);

          Swal.fire({
            title: this.language.translate('Error'),
            text:
              this.language.translate(error?.error?.message ||
              'Something went wrong. Please try again.'),
            icon: 'error',
            confirmButtonText: this.language.translate('OK'),
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
