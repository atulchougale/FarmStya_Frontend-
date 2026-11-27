import { Injectable } from '@angular/core';
import { Observable, shareReplay, tap } from 'rxjs';
import { videoSource } from './video-source';

@Injectable({ providedIn: 'root' })
export class VideoPreviewService {
  private readonly cache = new Map<string, Observable<string | null>>();

  preview(url: string): Observable<string | null> {
    const existing = this.cache.get(url);
    if (existing) return existing;
    if (this.cache.size >= 40) this.cache.delete(this.cache.keys().next().value!);
    const result = new Observable<string | null>(subscriber => {
      const video = document.createElement('video');
      let finished = false;
      let retried = false;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      const clear = () => {
        video.onloadedmetadata = null; video.onloadeddata = null;
        video.onseeked = null; video.onerror = null;
        video.pause(); video.removeAttribute('src'); video.load();
      };
      const finish = (image: string | null) => {
        if (finished) return;
        finished = true; clearTimeout(timeout); clear();
        subscriber.next(image); subscriber.complete();
      };
      const capture = () => {
        if (finished || !video.videoWidth || video.readyState < 2 || video.seeking) return;
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(640, video.videoWidth);
          canvas.height = Math.max(1, Math.round(canvas.width * video.videoHeight / video.videoWidth));
          const ctx = canvas.getContext('2d');
          if (!ctx) return finish(null);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          finish(canvas.toDataURL('image/jpeg', .8));
        } catch { finish(null); }
      };
      const timeout = setTimeout(() => finish(null), 15000);
      video.onloadedmetadata = () => {
        if (Number.isFinite(video.duration) && video.duration > 0)
          video.currentTime = Math.min(.1, video.duration / 2);
      };
      video.onloadeddata = capture;
      video.onseeked = capture;
      video.onerror = () => {
        if (!retried) { retried = true; video.src = videoSource(url, true, true); video.load(); }
        else finish(null);
      };
      video.src = videoSource(url, true);
      video.load();
      return () => { finished = true; clearTimeout(timeout); clear(); };
    }).pipe(
      tap(image => { if (image === null) this.cache.delete(url); }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    this.cache.set(url, result);
    return result;
  }
}
