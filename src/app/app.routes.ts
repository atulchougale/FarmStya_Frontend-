import { Routes } from '@angular/router';

import { NotFoundComponent } from './shared/components/not-found/not-found.component';

import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { ClientLayoutComponent } from './layouts/client-layout/client-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';

import { authGuard } from './core/guards/auth.guard';

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

      // Dashboard - Protected
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (c) => c.DashboardComponent,
          ),
        canActivate: [authGuard],
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

      // Profile - Protected
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
      // Admin Dashboard
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/admin-dashboard/admin-dashboard.component').then(
            (c) => c.AdminDashboardComponent,
          ),
        canActivate: [authGuard],
      },

      // Gallery List
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
