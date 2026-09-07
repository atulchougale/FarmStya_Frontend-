import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { LoginResponse } from '../../features/auth/models/login-response.model';

@Injectable({
  providedIn: 'root',
})
export class TokenService {

  private readonly ACCESS_TOKEN_KEY = 'farmstay_access_token';
  private readonly REFRESH_TOKEN_KEY = 'farmstay_refresh_token';
  private readonly USER_KEY = 'farmstay_user';

  // Holds current logged in user
  private currentUserSubject =
    new BehaviorSubject<LoginResponse | null>(null);

  // Observable for all components
  currentUser$ =
    this.currentUserSubject.asObservable();

  // Holds login status
  private isLoggedInSubject =
    new BehaviorSubject<boolean>(false);

  // Observable for login state
  isLoggedIn$ =
    this.isLoggedInSubject.asObservable();

  constructor() {}

  saveLogin(
    user: LoginResponse,
    rememberMe: boolean
  ): void {

    const storage = rememberMe
      ? localStorage
      : sessionStorage;

    // Clear old login data
    this.clearStorage();

    // Save Access Token
    storage.setItem(
      this.ACCESS_TOKEN_KEY,
      user.accessToken
    );

    // Save Refresh Token
    storage.setItem(
      this.REFRESH_TOKEN_KEY,
      user.refreshToken
    );

    // Save current user/login response
    storage.setItem(
      this.USER_KEY,
      JSON.stringify(user)
    );

    // Update RxJS state
    this.currentUserSubject.next(user);
    this.isLoggedInSubject.next(true);
  }

  getAccessToken(): string | null {
    return (
      localStorage.getItem(this.ACCESS_TOKEN_KEY) ??
      sessionStorage.getItem(this.ACCESS_TOKEN_KEY)
    );
  }

  getRefreshToken(): string | null {
    return (
      localStorage.getItem(this.REFRESH_TOKEN_KEY) ??
      sessionStorage.getItem(this.REFRESH_TOKEN_KEY)
    );
  }

  getCurrentUser(): LoginResponse | null {

    const user =
      localStorage.getItem(this.USER_KEY) ??
      sessionStorage.getItem(this.USER_KEY);

    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user) as LoginResponse;
    } catch {
      return null;
    }
  }

  restoreLogin(): void {

    const user = this.getCurrentUser();

    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    if (user && accessToken && refreshToken) {

      this.currentUserSubject.next(user);
      this.isLoggedInSubject.next(true);

    } else {

      this.currentUserSubject.next(null);
      this.isLoggedInSubject.next(false);
    }
  }

  updateTokens(
    accessToken: string,
    refreshToken: string
  ): void {

    if (localStorage.getItem(this.ACCESS_TOKEN_KEY)) {

      localStorage.setItem(
        this.ACCESS_TOKEN_KEY,
        accessToken
      );

      localStorage.setItem(
        this.REFRESH_TOKEN_KEY,
        refreshToken
      );

    } else {

      sessionStorage.setItem(
        this.ACCESS_TOKEN_KEY,
        accessToken
      );

      sessionStorage.setItem(
        this.REFRESH_TOKEN_KEY,
        refreshToken
      );
    }

    const currentUser = this.getCurrentUser();

    if (currentUser) {

      const updatedUser: LoginResponse = {
        ...currentUser,
        accessToken,
        refreshToken,
      };

      const storage =
        localStorage.getItem(this.USER_KEY)
          ? localStorage
          : sessionStorage;

      storage.setItem(
        this.USER_KEY,
        JSON.stringify(updatedUser)
      );

      this.currentUserSubject.next(updatedUser);
    }
  }

  logout(): void {
    this.clearStorage();

    // Clear RxJS state
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
  }

  isLoggedIn(): boolean {
    return (
      this.getAccessToken() !== null &&
      this.getRefreshToken() !== null
    );
  }

  private clearStorage(): void {

    // Remove from Local Storage
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    // Remove from Session Storage
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
  }
}