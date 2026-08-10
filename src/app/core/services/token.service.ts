import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { LoginResponse } from '../models/login-response.model';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly TOKEN_KEY = 'farmstay_token';

  private readonly USER_KEY = 'farmstay_user';
  // Holds current logged in user
  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(null);

  // Observable for all components
  currentUser$ = this.currentUserSubject.asObservable();

  // Holds login status
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);

  // Observable for login state
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor() {}

  saveLogin(user: LoginResponse, rememberMe: boolean): void {
    const storage = rememberMe ? localStorage : sessionStorage;

    // Clear old login data
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);

    // Save token
    storage.setItem(this.TOKEN_KEY, user.token);

    // Save user
    storage.setItem(this.USER_KEY, JSON.stringify(user));

    // Update RxJS state
    this.currentUserSubject.next(user);

    this.isLoggedInSubject.next(true);
  }

  getToken(): string | null {
    return (
      localStorage.getItem(this.TOKEN_KEY) ??
      sessionStorage.getItem(this.TOKEN_KEY)
    );
  }

  getCurrentUser(): LoginResponse | null {
    const user =
      localStorage.getItem(this.USER_KEY) ??
      sessionStorage.getItem(this.USER_KEY);

    return user ? JSON.parse(user) : null;
  }

  restoreLogin(): void {
    const user = this.getCurrentUser();

    if (user) {
      this.currentUserSubject.next(user);

      this.isLoggedInSubject.next(true);
    } else {
      this.currentUserSubject.next(null);

      this.isLoggedInSubject.next(false);
    }
    // console.log(this.getCurrentUser());
  }

  logout(): void {
    // Remove from Local Storage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    // Remove from Session Storage
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);

    // Clear RxJS State
    this.currentUserSubject.next(null);

    this.isLoggedInSubject.next(false);
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }
}
