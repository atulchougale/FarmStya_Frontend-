import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { TokenService } from './core/services/token.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'Frontend';

  constructor(private tokenService: TokenService) {
    this.tokenService.restoreLogin();
  }
}
