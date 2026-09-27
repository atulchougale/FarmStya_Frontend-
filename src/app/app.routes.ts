import { Routes } from '@angular/router';

import { RegisterComponent } from './features/auth/register/register.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
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
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(
            (c) => c.LoginComponent,
          ),
      },

      {
        path: 'register',
        component: RegisterComponent,
      },

      {
        path: 'verify-email',
        loadComponent: () =>
          import('./features/auth/verify-email/verify-email.component').then(
            (c) => c.VerifyEmailComponent,
          ),
      },

      {
        path: 'forgot-password',
        component: ForgotPasswordComponent,
      },

      // ==========================
      // Reset Password
      // Email + OTP
      // ==========================

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
      // Home (Public)

      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home.component').then((c) => c.HomeComponent),
      },

      // Dashboard (Protected)

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (c) => c.DashboardComponent,
          ),
        canActivate: [authGuard],
      },

      // Future Public Pages

      // {
      //   path: 'gallery',
      //   loadComponent: () =>
      //     import('./features/gallery/gallery.component').then(
      //       (c) => c.GalleryComponent
      //     ),
      // },

      // {
      //   path: 'about',
      //   loadComponent: () =>
      //     import('./features/about/about.component').then(
      //       (c) => c.AboutComponent
      //     ),
      // },

      // {
      //   path: 'contact',
      //   loadComponent: () =>
      //     import('./features/contact/contact.component').then(
      //       (c) => c.ContactComponent
      //     ),
      // },

      // ==========================
      // Profile (Protected)
      // ==========================
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile/profile.component').then(
            (c) => c.ProfileComponent,
          ),
        canActivate: [authGuard],
      },

      // ==========================
      // Change Password (Protected)
      // ==========================
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
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/admin-dashboard/admin-dashboard.component').then(
            (c) => c.AdminDashboardComponent,
          ),
        canActivate: [authGuard],
      },

      // Gallery
      {
        path: 'website-settings/gallery',
        loadComponent: () =>
          import('./features/admin/gallery/gallery-view/gallery-view.component').then(
            (c) => c.GalleryViewComponent,
          ),
        canActivate: [authGuard],
      },

      {
        path: 'website-settings/gallery/gallery-create',
        loadComponent: () =>
          import('./features/admin/gallery/gallery-create/gallery-create.component').then(
            (c) => c.GalleryCreateComponent,
          ),
        canActivate: [authGuard],
      },
      {
        path: 'website-settings/gallery/gallery-create/:id',
        loadComponent: () =>
          import('./features/admin/gallery/gallery-create/gallery-create.component').then(
            (c) => c.GalleryCreateComponent,
          ),
        canActivate: [authGuard],
      },
    ],
  },
  // ==========================
  // 404
  // ==========================

  {
    path: '**',
    component: NotFoundComponent,
  },
];
