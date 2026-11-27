import { bookingEntryGuard } from './core/guards/booking-entry.guard';
import { adminBookingCreateGuard } from './core/guards/admin-booking-create.guard';
import { reportingGuard } from './features/admin/reporting/guards/reporting.guard';
import { pricingManagementGuard } from './core/guards/pricing-management.guard';
import { Routes } from '@angular/router';

import { NotFoundComponent } from './shared/components/not-found/not-found.component';

import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { ClientLayoutComponent } from './layouts/client-layout/client-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';

import { authGuard } from './core/guards/auth.guard';
import { bookingAdministrationGuard } from './core/guards/booking-administration.guard';

export const routes: Routes = [
  // ==========================
  // Default Route
  // ==========================
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },

  // ==========================
  // Authentication Layout
  // ==========================
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      // Login
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(
            (c) => c.LoginComponent,
          ),
      },

      // Register - Lazy Loaded
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then(
            (c) => c.RegisterComponent,
          ),
      },

      // Verify Email
      {
        path: 'verify-email',
        loadComponent: () =>
          import('./features/auth/verify-email/verify-email.component').then(
            (c) => c.VerifyEmailComponent,
          ),
      },

      // Forgot Password - Lazy Loaded
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password.component').then(
            (c) => c.ForgotPasswordComponent,
          ),
      },

      // Reset Password
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password.component').then(
            (c) => c.ResetPasswordComponent,
          ),
      },
    ],
  },

  // ==========================
  // Client Layout
  // ==========================
  {
    path: '',
    component: ClientLayoutComponent,
    children: [
      // Home - Public
      {
        path: 'home',
        loadComponent: () =>
          import('./features/public/home/home.component').then(
            (c) => c.HomeComponent,
          ),
      },

      // Public Gallery
      {
        path: 'gallery',
        loadComponent: () =>
          import('./features/public/gallery-public/gallery-public.component').then(
            (c) => c.GalleryPublicComponent,
          ),
      },

      // Public About Us
      {
        path: 'about',
        loadComponent: () =>
          import('./features/public/about-us/about-us-public/about-us-public.component').then(
            (c) => c.AboutUsPublicComponent,
          ),
      },

      // Public Contact Us
      {
        path: 'contact',
        loadComponent: () =>
          import('./features/public/contact-us/contact-us/contact-us.component').then(
            (c) => c.ContactUsComponent,
          ),
      },

      // Public Feedback - Protected
      {
        path: 'feedback',
        loadComponent: () =>
          import('./features/public/public-feedback/public-feedback.component').then(
            (c) => c.PublicFeedbackComponent,
          ),
        canActivate: [authGuard],
      },

      // Public Feedback - Protected
      {
        path: 'booking',
        canActivate: [bookingEntryGuard],
        loadComponent: () =>
          import('./features/public/booking/booking-page/booking-page.component').then(
            (c) => c.BookingPageComponent,
          ),
        // canActivate: [authGuard],
      },

      // Profile - Protected
      {
        path: 'my-bookings',
        loadComponent: () =>
          import('./features/public/booking/my-booking/my-booking.component').then(
            (c) => c.MyBookingComponent,
          ),
        canActivate: [authGuard],
      },
      {
        path: 'my-bookings/:bookingId',
        loadComponent: () =>
          import('./features/public/booking/customer-booking-details/customer-booking-details.component').then(
            (c) => c.CustomerBookingDetailsComponent,
          ),
        canActivate: [authGuard],
      },

      {
        path: 'profile/edit',
        loadComponent: () => import('./features/profile/edit-profile/edit-profile.component').then(c => c.EditProfileComponent),
        canActivate: [authGuard],
      },

      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile/profile.component').then(
            (c) => c.ProfileComponent,
          ),
        canActivate: [authGuard],
      },

      // Change Password - Protected
      {
        path: 'change-password',
        loadComponent: () =>
          import('./features/profile/change-password/change-password.component').then(
            (c) => c.ChangePasswordComponent,
          ),
        canActivate: [authGuard],
      },
    ],
  },

  // ==========================
  // Admin Layout
  // ==========================
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      {path: 'accounts', canActivate: [authGuard], loadChildren: () => import('./features/admin/accounts/accounts.routes').then(m => m.ACCOUNTS_ROUTES)},
      // Admin Dashboard
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/admin-dashboard/admin-dashboard.component').then(
            (c) => c.AdminDashboardComponent,
          ),
        canActivate: [authGuard, bookingAdministrationGuard],
      },

      // Gallery List
      { path: 'reports', children: [
        { path: '', pathMatch: 'full', redirectTo: '/admin/reporting' },
        { path: ':report', redirectTo: '/admin/reporting/:report' }
      ] },
      {
        path: 'reporting',
        canActivate: [authGuard],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/admin/reporting/pages/reports.component').then(
                (c) => c.ReportsComponent,
              ),
            canActivate: [reportingGuard],
          },
          {
            path: 'bookings',
            data: { reportKey: 'bookings' },
            loadComponent: () =>
              import('./features/admin/reporting/pages/booking-report.component').then(
                (c) => c.BookingReportComponent,
              ),
            canActivate: [reportingGuard],
          },
          {
            path: 'revenue',
            data: { reportKey: 'revenue' },
            loadComponent: () =>
              import('./features/admin/reporting/pages/revenue-report.component').then(
                (c) => c.RevenueReportComponent,
              ),
            canActivate: [reportingGuard],
          },
          {
            path: 'customers',
            data: { reportKey: 'customers' },
            loadComponent: () =>
              import('./features/admin/reporting/pages/customer-report.component').then(
                (c) => c.CustomerReportComponent,
              ),
            canActivate: [reportingGuard],
          },
          {
            path: 'occupancy',
            data: { reportKey: 'occupancy' },
            loadComponent: () =>
              import('./features/admin/reporting/pages/occupancy-report.component').then(
                (c) => c.OccupancyReportComponent,
              ),
            canActivate: [reportingGuard],
          },
        ],
      },
      {
        path: 'booking',
        loadComponent: () =>
          import('./features/admin/Booking/booking-view/booking-view.component').then(
            (c) => c.BookingViewComponent,
          ),
        canActivate: [authGuard, bookingAdministrationGuard],
      },
      { path: 'bookings', redirectTo: 'booking', pathMatch: 'full' },
      { path: 'bookings/bookings', redirectTo: 'booking', pathMatch: 'full' },
      {
        path: 'bookings/create',
        loadComponent: () =>
          import('./features/admin/Booking/create-booking/admin-create-booking.component').then(
            (c) => c.AdminCreateBookingComponent,
          ),
        canActivate: [
          authGuard,
          bookingAdministrationGuard,
          adminBookingCreateGuard,
        ],
      },
      {
        path: 'booking/:bookingId/checkout',
        loadComponent: () =>
          import('./features/admin/Booking/checkout/checkout.component').then(
            (c) => c.CheckoutComponent,
          ),
        canActivate: [authGuard, bookingAdministrationGuard],
      },
      {
        path: 'booking/:bookingId',
        loadComponent: () =>
          import('./features/admin/Booking/booking-details/booking-details.component').then(
            (c) => c.BookingDetailsComponent,
          ),
        canActivate: [authGuard, bookingAdministrationGuard],
      },

      {
        path: 'website-settings/pricing',
        loadComponent: () =>
          import('./features/admin/pricing/pricing-management.component').then(
            (c) => c.PricingManagementComponent,
          ),
        canActivate: [
          authGuard,
          bookingAdministrationGuard,
          pricingManagementGuard,
        ],
      },

      {
        path: 'website-settings/gallery',
        loadComponent: () =>
          import('./features/admin/gallery/gallery-view/gallery-view.component').then(
            (c) => c.GalleryViewComponent,
          ),
        canActivate: [authGuard],
      },

      // Gallery Create
      {
        path: 'website-settings/gallery/gallery-create',
        loadComponent: () =>
          import('./features/admin/gallery/gallery-create/gallery-create.component').then(
            (c) => c.GalleryCreateComponent,
          ),
        canActivate: [authGuard],
      },

      // Gallery Edit
      {
        path: 'website-settings/gallery/gallery-create/:id',
        loadComponent: () =>
          import('./features/admin/gallery/gallery-create/gallery-create.component').then(
            (c) => c.GalleryCreateComponent,
          ),
        canActivate: [authGuard],
      },

      // Amenity List
      {
        path: 'website-settings/amenity',
        loadComponent: () =>
          import('./features/admin/amenity/amenity-view/amenity-view.component').then(
            (c) => c.AmenityViewComponent,
          ),
        canActivate: [authGuard],
      },

      // Amenity Create
      {
        path: 'website-settings/amenity/amenity-create',
        loadComponent: () =>
          import('./features/admin/amenity/amenity-create/amenity-create.component').then(
            (c) => c.AmenityCreateComponent,
          ),
        canActivate: [authGuard],
      },

      // Amenity Edit
      {
        path: 'website-settings/amenity/amenity-create/:id',
        loadComponent: () =>
          import('./features/admin/amenity/amenity-create/amenity-create.component').then(
            (c) => c.AmenityCreateComponent,
          ),
        canActivate: [authGuard],
      },
      // Contact Message List
      {
        path: 'website-settings/message',
        loadComponent: () =>
          import('./features/admin/ContactUsMessage/contact-messages/contact-messages.component').then(
            (c) => c.ContactMessagesComponent,
          ),
        canActivate: [authGuard],
      },

      // About Us View
      {
        path: 'website-settings/aboutus',
        loadComponent: () =>
          import('./features/admin/aboutus/about-us-view/about-us-view.component').then(
            (c) => c.AboutUsViewComponent,
          ),
        canActivate: [authGuard],
      },

      // About Us Create
      {
        path: 'website-settings/aboutus/create',
        loadComponent: () =>
          import('./features/admin/aboutus/about-us-form/about-us-form.component').then(
            (c) => c.AboutUsFormComponent,
          ),
        canActivate: [authGuard],
      },

      // About Us Edit
      {
        path: 'website-settings/aboutus/edit/:id',
        loadComponent: () =>
          import('./features/admin/aboutus/about-us-form/about-us-form.component').then(
            (c) => c.AboutUsFormComponent,
          ),
        canActivate: [authGuard],
      },

      // Feedback list
      {
        path: 'website-settings/feedback',
        loadComponent: () =>
          import('./features/admin/Feedback/feedback-view/feedback-view.component').then(
            (c) => c.FeedbackViewComponent,
          ),
        canActivate: [authGuard],
      },
    ],
  },

  // ==========================
  // 404 - Not Found
  // ==========================
  {
    path: '**',
    component: NotFoundComponent,
  },
];
