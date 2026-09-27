export interface AdminMenuData {
  modules: AdminModuleMenu[];
}

export interface AdminModuleMenu {
  moduleId: number;
  moduleName: string;
  displayName: string;
  icon: string;
  route: string;
  displayOrder: number;
  subMenus?: AdminSubMenu[];
}


export interface AdminSubMenu {
  name: string;
  route: string;
  permissions: string[];
}

