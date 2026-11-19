import { Injectable, effect, inject } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { LanguageService } from './language';

@Injectable()
export class LocalizedPaginator extends MatPaginatorIntl {
  private readonly language = inject(LanguageService);
  constructor() {
    super();
    effect(() => {
      this.language.language();
      this.itemsPerPageLabel = this.language.translate('Items per page:');
      this.nextPageLabel = this.language.translate('Next page');
      this.previousPageLabel = this.language.translate('Previous page');
      this.firstPageLabel = this.language.translate('First page');
      this.lastPageLabel = this.language.translate('Last page');
      this.changes.next();
    });
    this.getRangeLabel = (page, pageSize, length) => {
      const start = length && pageSize ? page * pageSize + 1 : 0;
      const end = Math.min(length, (page + 1) * pageSize);
      return this.language.translate('{p0}–{p1} of {p2}', { p0: start, p1: end, p2: length });
    };
  }
}
