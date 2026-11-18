export function isAdministrationRole(roleName: string | null | undefined): boolean {
  const role = roleName?.trim().toLowerCase();
  return role === 'admin' || role === 'farm owner' || role === 'farmowner' || role === 'super admin';
}
