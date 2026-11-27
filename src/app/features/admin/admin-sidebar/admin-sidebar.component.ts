import { TranslationPipe } from '../../../core/i18n/language';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AdminModuleMenu } from '../models/admin-menu.model';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [TranslationPipe, CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css'
})
export class AdminSidebarComponent implements OnInit {
  menuItems: AdminModuleMenu[] = [];
  loading = false;
  expandedModules = new Set<number>();

  constructor(private readonly adminService: AdminService) {}

  get canCreateBooking(): boolean {
    return this.menuItems.some(m => m.subMenus?.some(s => s.permissions.includes('Bookings.Create')));
  }

  ngOnInit(): void { this.loadAdminMenu(); }

  private loadAdminMenu(): void {
    this.loading = true;
    this.adminService.getAdminMenu().pipe(finalize(() => this.loading = false)).subscribe({
      next: response => { this.menuItems = response.success && response.data ? response.data.modules : []; },
      error: error => { console.error('Failed to load admin menu:', error); this.menuItems = []; }
    });
  }

  toggleModule(moduleId: number): void {
    if (this.expandedModules.has(moduleId)) this.expandedModules.delete(moduleId);
    else this.expandedModules.add(moduleId);
  }

  isModuleExpanded(moduleId: number): boolean { return this.expandedModules.has(moduleId); }

  getAdminRoute(route: string): string {
    const path = '/' + (route ?? '').trim().split('/').filter(Boolean).join('/');
    const relative = path === '/admin' ? '/' : path.startsWith('/admin/') ? path.slice(6) : path;
    if (relative === '/bookings' || relative === '/bookings/bookings') return '/admin/booking';
    if (relative === '/reports' || relative.startsWith('/reports/')) return '/admin/reporting' + relative.slice(8);
    return relative === '/' ? '/admin' : `/admin${relative}`;
  }
}
