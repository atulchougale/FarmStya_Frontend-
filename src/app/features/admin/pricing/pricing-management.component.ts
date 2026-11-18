import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { PricingManagementService, PricingEntry } from '../../../core/services/pricing-management.service';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pricing-management.component.html',
  styleUrl: './pricing-management.component.css'
})
export class PricingManagementComponent implements OnInit {
  entries: PricingEntry[] = [];
  draft: PricingEntry | null = null;
  loading = false;
  saving = false;
  canCreate = false;
  canEdit = false;
  canDelete = false;
  error = '';
  notice = '';
  readonly keys = ['BOOKING_DAILY', 'NORMAL_EVENT_DAILY', 'DECORATION_EVENT_DAILY', 'ADVANCE_DAILY'];
  constructor(private readonly pricing: PricingManagementService, private readonly admin: AdminService) {}
  ngOnInit(): void {
    this.load();
    this.admin.getAdminMenu().subscribe({
      next: response => {
        const grants = response.data?.modules.flatMap(module => module.subMenus?.flatMap(menu => menu.permissions) ?? []) ?? [];
        this.canCreate = grants.includes('Pricing.Create');
        this.canEdit = grants.includes('Pricing.Edit');
        this.canDelete = grants.includes('Pricing.Delete');
      },
      error: () => { this.error = 'Could not load pricing permissions.'; }
    });
  }
  load(): void {
    this.loading = true;
    this.pricing.list().pipe(finalize(() => this.loading = false)).subscribe({
      next: response => { this.entries = response.data ?? []; },
      error: error => { this.error = error.error?.message ?? 'Could not load pricing.'; }
    });
  }
  create(): void {
    this.error = '';
    this.notice = '';
    this.draft = { pricingId: 0, pricingKey: '', pricingName: '', price: 0, currencyCode: 'INR', isActive: true };
  }
  edit(entry: PricingEntry): void {
    this.error = '';
    this.notice = '';
    this.draft = { ...entry };
  }
  save(): void {
    if (!this.draft || this.saving || (this.draft.pricingId ? !this.canEdit : !this.canCreate)) return;
    this.error = '';
    this.notice = '';
    this.saving = true;
    const request = this.draft.pricingId ? this.pricing.update(this.draft) : this.pricing.create(this.draft);
    request.pipe(finalize(() => this.saving = false)).subscribe({
      next: response => { this.notice = response.message; this.draft = null; this.load(); },
      error: error => { this.error = error.error?.message ?? 'Could not save pricing.'; }
    });
  }
  async remove(entry: PricingEntry): Promise<void> {
    if (!this.canDelete || this.saving) return;
    const decision = await Swal.fire({
      title: 'Delete pricing?',
      text: entry.pricingName + ' will be removed from active pricing. Bookings requiring this rate will need it restored before submission.',
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Delete', confirmButtonColor: '#b23b3b'
    });
    if (!decision.isConfirmed || this.saving) return;
    this.saving = true;
    this.error = '';
    this.notice = '';
    this.pricing.delete(entry.pricingId).pipe(finalize(() => this.saving = false)).subscribe({
      next: response => {
        this.notice = response.message;
        if (this.draft?.pricingId === entry.pricingId) this.draft = null;
        this.load();
      },
      error: error => { this.error = error.error?.message ?? 'Could not delete pricing.'; }
    });
  }
}
