
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionService } from './core/services/session.service';
import { TokenService } from './core/services/token.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'Frontend';

  constructor(
    private tokenService: TokenService,
    private readonly session: SessionService,
    private readonly themeService: ThemeService
  ) {
    this.themeService.initialize();
    this.tokenService.restoreLogin();
  }
}
