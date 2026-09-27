
import { Component, OnInit } from '@angular/core';
import {
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import { AdminModuleMenu } from '../models/admin-menu.model';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css'
})
// export class AdminSidebarComponent implements OnInit {

//   menuItems: AdminModuleMenu[] = [];

//   constructor(
//     private readonly adminService: AdminService
//   ) { }

//   ngOnInit(): void {
//     this.loadAdminMenu();
//   }

//   private loadAdminMenu(): void {
//     this.adminService.getAdminMenu().subscribe({
//       next: (response) => {

//         if (response.success && response.data) {
//           this.menuItems = response.data.modules;
//         } else {
//           this.menuItems = [];
//         }

//       },
//       error: (error) => {

//         console.error(
//           'Failed to load admin menu:',
//           error
//         );

//         this.menuItems = [];
//       }
//     });
//   }

//   getAdminRoute(route: string): string {

//     if (!route) {
//       return '/admin';
//     }

//     return `/admin${route.startsWith('/') ? route : `/${route}`}`;
//   }
// }


export class AdminSidebarComponent implements OnInit {

  menuItems: AdminModuleMenu[] = [];

  expandedModules = new Set<number>();

  constructor(
    private readonly adminService: AdminService
  ) { }

  ngOnInit(): void {
    this.loadAdminMenu();
  }

  private loadAdminMenu(): void {
    this.adminService.getAdminMenu().subscribe({
      next: (response) => {

        if (response.success && response.data) {
          this.menuItems = response.data.modules;
        } else {
          this.menuItems = [];
        }

      },
      error: (error) => {

        console.error(
          'Failed to load admin menu:',
          error
        );

        this.menuItems = [];
      }
    });
  }

  toggleModule(moduleId: number): void {
    if (this.expandedModules.has(moduleId)) {
      this.expandedModules.delete(moduleId);
    } else {
      this.expandedModules.add(moduleId);
    }
  }

  isModuleExpanded(moduleId: number): boolean {
    return this.expandedModules.has(moduleId);
  }

  getAdminRoute(route: string): string {

    if (!route) {
      return '/admin';
    }

    return `/admin${route.startsWith('/') ? route : `/${route}`}`;
  }
}
