import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { AdminSidebarComponent } from '../../features/admin/admin-sidebar/admin-sidebar.component';



@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet,HeaderComponent,FooterComponent,AdminSidebarComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {}
