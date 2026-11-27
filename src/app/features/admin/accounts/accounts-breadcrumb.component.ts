import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslationPipe } from '../../../core/i18n/language';
@Component({selector:'app-accounts-breadcrumb',standalone:true,imports:[CommonModule,RouterLink,TranslationPipe],template:`<nav class="account-breadcrumb" aria-label="Breadcrumb"><a routerLink="/admin/accounts"><i class="bi bi-wallet2" aria-hidden="true"></i>{{ 'Accounts' | t }}</a><span aria-hidden="true">/</span><a *ngIf="parent" [routerLink]="parentPath">{{ parent | t }}</a><span *ngIf="parent" aria-hidden="true">/</span><span aria-current="page">{{ label | t }}</span><a class="account-menu-back" routerLink="/admin/accounts"><i class="bi bi-arrow-left" aria-hidden="true"></i>{{ 'Back to Accounts' | t }}</a></nav>`,styles:[`:host{display:block}.account-breadcrumb{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:24px;font-size:14px;color:var(--text-muted)}a{color:var(--primary-700);text-decoration:none;display:inline-flex;align-items:center;gap:8px;min-height:40px}a:hover{text-decoration:underline}.account-menu-back{margin-left:auto;font-weight:650}@media(max-width:560px){.account-menu-back{margin-left:0;flex-basis:100%}}`]})
export class AccountsBreadcrumbComponent {
 @Input() label='';@Input() parent='';@Input() parentPath='/admin/accounts';
}
