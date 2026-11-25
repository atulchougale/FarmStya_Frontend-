import { TranslationPipe } from '../../../core/i18n/language';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { A11yModule } from '@angular/cdk/a11y';
import { Subject, takeUntil } from 'rxjs';
import { PublicSiteService } from '../../../core/services/public-site.service';
import { GalleryResponseDto } from './gallery.model';

type MediaFilter = 'all' | 'photos' | 'videos';
@Component({ selector: 'app-gallery', standalone: true,
  imports: [TranslationPipe, CommonModule, RouterLink, A11yModule],
  templateUrl: './gallery-public.component.html', styleUrl: './gallery-public.component.css' })
export class GalleryPublicComponent implements OnInit, OnDestroy {
  galleryItems: GalleryResponseDto[] = [];
  filteredItems: GalleryResponseDto[] = [];
  categories: string[] = [];
  mediaFilter: MediaFilter = 'all';
  category = '';
  activeIndex = 0;
  loading = true;
  errorMessage = '';
  selectedGalleryItem: GalleryResponseDto | null = null;
  modalMediaError = false;
  readonly failedPreviews = new Set<number>();
  private previousOverflow = '';
  private readonly destroy$ = new Subject<void>();
  constructor(private readonly publicSiteService: PublicSiteService) {}
  get activeItem(): GalleryResponseDto | undefined { return this.filteredItems[this.activeIndex]; }
  ngOnInit(): void { this.loadGallery(); }
  loadGallery(): void {
    this.loading = true; this.errorMessage = ''; this.failedPreviews.clear();
    this.publicSiteService.getGallery().pipe(takeUntil(this.destroy$)).subscribe({ next: response => {
      if (!response.success) { this.errorMessage = 'Unable to load gallery images. Please try again later.'; this.galleryItems = []; }
      else this.galleryItems = [...(response.data ?? [])].sort((a, b) => a.displayOrder - b.displayOrder || a.imageId - b.imageId);
      this.categories = [...new Set(this.galleryItems.map(item => item.category?.trim()).filter((c): c is string => !!c))];
      if (!this.categories.includes(this.category)) this.category = '';
      this.applyFilters(); this.loading = false;
    }, error: () => {
      this.galleryItems = []; this.filteredItems = []; this.categories = [];
      this.errorMessage = 'Unable to load gallery images. Please try again later.'; this.loading = false;
    } });
  }
  isVideo(url: string): boolean { return /\.(mp4|webm|ogg|ogv|mov|m4v)(?:[?#]|$)/i.test(url ?? ''); }
  filterMedia(filter: MediaFilter): void { this.mediaFilter = filter; this.applyFilters(); }
  filterCategory(category: string): void { this.category = category; this.applyFilters(); }
  resetFilters(): void { this.mediaFilter = 'all'; this.category = ''; this.applyFilters(); }
  private applyFilters(): void {
    this.filteredItems = this.galleryItems.filter(item =>
      (!this.category || item.category?.trim() === this.category) &&
      (this.mediaFilter === 'all' || (this.mediaFilter === 'videos' ? this.isVideo(item.imageUrl) : !this.isVideo(item.imageUrl))));
    this.activeIndex = 0;
  }
  selectItem(index: number): void { this.activeIndex = index; }
  move(offset: number): void {
    if (!this.filteredItems.length) return;
    this.modalMediaError = false;
    this.activeIndex = (this.activeIndex + offset + this.filteredItems.length) % this.filteredItems.length;
    if (this.selectedGalleryItem) this.selectedGalleryItem = this.activeItem ?? null;
  }
  categoryIcon(category: string): string {
    const name = category.toLowerCase();
    if (/pool|water|swim/.test(name)) return 'bi-water';
    if (/room|stay|bed/.test(name)) return 'bi-door-open';
    if (/food|dining|meal/.test(name)) return 'bi-cup-hot';
    if (/garden|nature|outdoor/.test(name)) return 'bi-tree';
    if (/family|event/.test(name)) return 'bi-people';
    return 'bi-house';
  }
  preparePreview(event: Event): void {
    const video = event.target as HTMLVideoElement;
    video.muted = true;
    // Decode a real frame without autoplaying all gallery videos.
    if (Number.isFinite(video.duration) && video.duration > 0) video.currentTime = Math.min(.1, video.duration / 2);
  }
  previewFailed(item: GalleryResponseDto): void { this.failedPreviews.add(item.imageId); }
  openGalleryModal(item: GalleryResponseDto): void {
    this.activeIndex = Math.max(0, this.filteredItems.findIndex(media => media.imageId === item.imageId));
    this.modalMediaError = false;
    this.previousOverflow = document.body.style.overflow;
    this.selectedGalleryItem = item;
    document.body.style.overflow = 'hidden';
  }
  closeGalleryModal(): void {
    if (!this.selectedGalleryItem) return;
    this.selectedGalleryItem = null; document.body.style.overflow = this.previousOverflow;
  }
  @HostListener('document:keydown', ['$event'])
  handleKey(event: KeyboardEvent): void {
    if (!this.selectedGalleryItem) return;
    if (event.key === 'Escape') { event.preventDefault(); this.closeGalleryModal(); }
    if (event.target instanceof HTMLVideoElement) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); this.move(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); this.move(1); }
  }
  trackByImageId(_index: number, item: GalleryResponseDto): number { return item.imageId; }
  ngOnDestroy(): void { this.closeGalleryModal(); this.destroy$.next(); this.destroy$.complete(); }
}
