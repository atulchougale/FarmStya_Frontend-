import { AdminSidebarComponent } from './admin-sidebar.component';
import { AdminService } from '../../../core/services/admin.service';

describe('AdminSidebarComponent menu routes', () => {
  const component = new AdminSidebarComponent({} as AdminService);
  it('maps API and legacy booking links to the canonical booking list', () => {
    for (const route of ['/booking','/bookings','/bookings/bookings','/admin/bookings/bookings','bookings/bookings'])
      expect(component.getAdminRoute(route)).toBe('/admin/booking');
  });
  it('preserves create, details and other modules without duplicating admin', () => {
    expect(component.getAdminRoute('/bookings/create')).toBe('/admin/bookings/create');
    expect(component.getAdminRoute('/admin/booking/42')).toBe('/admin/booking/42');
    expect(component.getAdminRoute('/website-settings/pricing')).toBe('/admin/website-settings/pricing');
    expect(component.getAdminRoute('/reports/bookings')).toBe('/admin/reports/bookings');
    expect(component.getAdminRoute('')).toBe('/admin');
  });
});
