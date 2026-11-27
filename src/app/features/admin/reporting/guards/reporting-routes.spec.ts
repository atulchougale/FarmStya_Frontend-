import { routes } from '../../../../app.routes';
describe('Reporting canonical routes', () => {
 const admin = routes.find(route => route.path === 'admin')!;
 it('uses reporting for the four report pages', () => {
  const reporting = admin.children!.find(route => route.path === 'reporting')!;
  expect(reporting.children!.filter(route => !!route.path).map(route => route.path)).toEqual(['bookings', 'revenue', 'customers', 'occupancy']);
 });
 it('redirects legacy report URLs to reporting', () => {
  const alias = admin.children!.find(route => route.path === 'reports')!;
  expect(alias.children!.find(route => route.path === '')!.redirectTo).toBe('/admin/reporting');
  expect(alias.children!.find(route => route.path === ':report')!.redirectTo).toBe('/admin/reporting/:report');
 });
});
