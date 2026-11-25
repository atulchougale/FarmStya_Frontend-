import { Component, Input } from '@angular/core';
/** Small consistent stroke icons for booking vouchers. SVG stays sharp at every display density. */
@Component({selector:'app-voucher-icon',standalone:true,template:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path [attr.d]="paths[name] || paths['document']"/></svg>`,styles:[`:host{display:inline-flex;width:1em;height:1em;flex-shrink:0;vertical-align:middle}svg{display:block;width:100%;height:100%}`]})
export class VoucherIconComponent {
 @Input() name='document';
 readonly paths:Record<string,string>={
 bed:'M3 18V7 M21 18V7 M3 14h18 M3 10h18v7H3z M6 10V7h5v3 M13 10V7h5v3 M2 20v-3h20v3',
 coins:'M9 3c-4 0-7 1.4-7 3s3 3 7 3 7-1.4 7-3-3-3-7-3z M2 6v5c0 1.7 3 3 7 3 1.5 0 3-.2 4-.6 M2 11v5c0 1.7 3 3 7 3 1.5 0 3-.2 4-.6 M16 10c-3.3 0-6 1.1-6 2.5s2.7 2.5 6 2.5 6-1.1 6-2.5-2.7-2.5-6-2.5z M10 12.5v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5',
 party:'M3 21l4-14 10 10-14 4z M5 15l4 4 M6 11l7 7 M11 3l1 3 M18 2l-2 6 M22 8l-5 3 M15 4l1-1 M21 14l-2-1',
 pdf:'M5 2h10l5 5v15H5z M15 2v6h5 M8 13h2v3H8v3 M13 19v-6h2v6z M18 13h-2v6 M16 16h2',
 document:'M6 2h10l4 4v16H6z M16 2v5h4 M9 11h8 M9 15h8 M9 19h5',
 identity:'M2 4h20v16H2z M7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z M4 17c0-4 6-4 6 0 M13 9h6 M13 13h6 M13 17h4',
 wallet:'M3 6l15-3v4 M3 7h18v14H3z M16 12h6v5h-6z M18 14.5h.1',
 person:'M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M3 22v-3c0-9 18-9 18 0v3',
 guests:'M9 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M2 21v-3c0-8 14-8 14 0v3 M17 4a3 3 0 0 1 0 6 M19 13c3 .5 3 3 3 7 M3 6a3 3 0 0 0 0 5',
 history:'M3 7A10 10 0 1 1 2 15 M3 2v6h6 M12 7v6l4 2',
 layers:'M2 7l10-5 10 5-10 5L2 7z M2 12l10 5 10-5 M2 17l10 5 10-5',
 calendar:'M4 4h16v18H4z M4 8h16 M8 2v4 M16 2v4',
 check:'M5 12l4 4L19 6',
 eye:'M1 12c6-10 16-10 22 0-6 10-16 10-22 0z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
 feedback:'M3 3h18v13H11l-5 5v-5H3z M7 7h10 M7 11h7',
 arrow:'M10 4l-8 8 8 8 M2 12h20'
 };
}
