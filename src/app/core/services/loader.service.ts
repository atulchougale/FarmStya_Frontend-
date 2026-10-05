
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private farmhouseNameSubject = new BehaviorSubject<string>('FarmStay');

  isLoading$ = this.loadingSubject.asObservable();
  farmhouseName$ = this.farmhouseNameSubject.asObservable();

  private activeRequests = 0;

  constructor() {}

  // Show global loader
  show(): void {
    this.loadingSubject.next(true);
  }

  // Hide global loader
  hide(): void {
    this.loadingSubject.next(false);
  }

  // Set dynamic farmhouse name
  setFarmhouseName(name: string): void {
    this.farmhouseNameSubject.next(name?.trim() || 'FarmStay');
  }

  // Track multiple concurrent API requests
  startRequest(): void {
    this.activeRequests++;

    if (this.activeRequests === 1) {
      this.show();
    }
  }

  // Finish one API request
  finishRequest(): void {
    if (this.activeRequests > 0) {
      this.activeRequests--;
    }

    if (this.activeRequests === 0) {
      this.hide();
    }
  }

  // Reset loader request tracking
  reset(): void {
    this.activeRequests = 0;
    this.hide();
  }
}