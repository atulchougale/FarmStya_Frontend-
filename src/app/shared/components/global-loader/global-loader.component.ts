
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-loader.component.html',
  styleUrl: './global-loader.component.css',
})
export class GlobalLoaderComponent {
  private loaderService = inject(LoaderService);

  isLoading$ = this.loaderService.isLoading$;
  farmhouseName$ = this.loaderService.farmhouseName$;
}