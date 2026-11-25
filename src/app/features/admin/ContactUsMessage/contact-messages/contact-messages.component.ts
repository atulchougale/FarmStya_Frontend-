import { TranslationPipe, LanguageService } from '../../../../core/i18n/language';
import { inject as injectLanguage } from '@angular/core';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';

import Swal from 'sweetalert2';
import { finalize } from 'rxjs';

import { ContactResponseDto } from '../models/message.model';
import { MessageService } from '../../../../core/services/message.service';

@Component({
  selector: 'app-contact-messages',
  standalone: true,
  imports: [TranslationPipe, CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
  ],
  templateUrl: './contact-messages.component.html',
  styleUrl: './contact-messages.component.css',
})
export class ContactMessagesComponent implements OnInit, AfterViewInit {
  readonly language = injectLanguage(LanguageService);
  displayedColumns: string[] = [
    'srNo',
    'fullName',
    'mobileNo',
    'message',
    'actions',
  ];

  dataSource = new MatTableDataSource<ContactResponseDto>([]);
  selectedMessage: ContactResponseDto | null = null;
  searchText = '';
  loading = false;
  deletingId: number | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private messageService: MessageService) {
    this.dataSource.filterPredicate = (
      message: ContactResponseDto,
      filter: string,
    ): boolean => {
      const searchValue = filter.trim().toLowerCase();

      return (
        message.fullName.toLowerCase().includes(searchValue) ||
        message.mobileNo.toLowerCase().includes(searchValue) ||
        (message.email ?? '').toLowerCase().includes(searchValue) ||
        (message.enquiryType ?? '').toLowerCase().includes(searchValue) ||
        message.message.toLowerCase().includes(searchValue)
      );
    };
  }

  ngOnInit(): void {
    this.loadContactMessages();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  loadContactMessages(): void {
    if (this.loading) return;
    this.loading = true;
    this.messageService.getContactAll().pipe(finalize(() => this.loading = false)).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.dataSource.data = response.data;
        } else {
          this.dataSource.data = [];
        }

        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
      },
      error: (error: Error) => {
        console.error('Error loading contact messages:', error);

        Swal.fire({
          icon: 'error',
          title: this.language.translate('Unable to Load Messages'),
          text: this.language.translate('Contact messages could not be loaded. Please try again.'),
          confirmButtonText: this.language.translate('OK'),
          confirmButtonColor: '#28643b',
        });
      },
    });
  }

  applyFilter(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchText = input.value;
    this.dataSource.filter = this.searchText.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearFilter(): void {
    this.searchText = '';
    this.dataSource.filter = '';

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  viewMessage(message: ContactResponseDto): void {
    this.selectedMessage = message;
  }

  closeMessage(): void {
    this.selectedMessage = null;
  }

  deleteMessage(contactId: number): void {
    const message = this.dataSource.data.find(
      (item) => item.contactId === contactId,
    );

    if (!message || this.deletingId !== null) {
      return;
    }

    Swal.fire({
      title: this.language.translate('Delete Message?'),
      text: this.language.translate("Are you sure you want to delete the message from {p0}?", {p0: (message.fullName)}),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.language.translate('Yes, Delete'),
      cancelButtonText: this.language.translate('Cancel'),
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: '#c74747',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (!result.isConfirmed || this.deletingId !== null) {
        return;
      }

      this.deletingId = contactId;
      this.messageService.deleteContact(contactId).pipe(finalize(() => this.deletingId = null)).subscribe({
        next: (response) => {
          if (response.success) {
            this.dataSource.data = this.dataSource.data.filter(
              (item) => item.contactId !== contactId,
            );

            if (this.selectedMessage?.contactId === contactId) {
              this.closeMessage();
            }

            Swal.fire({
              icon: 'success',
              title: this.language.translate('Deleted!'),
              text: this.language.translate('Contact message has been deleted successfully.'),
              confirmButtonText: this.language.translate('OK'),
              confirmButtonColor: '#28643b',
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: this.language.translate('Delete Failed'),
              text: this.language.translate('The contact message could not be deleted.'),
              confirmButtonText: this.language.translate('OK'),
            });
          }
        },
        error: (error: Error) => {
          console.error('Error deleting contact message:', error);

          Swal.fire({
            icon: 'error',
            title: this.language.translate('Delete Failed'),
            text: this.language.translate('An error occurred while deleting the message.'),
            confirmButtonText: this.language.translate('OK'),
            confirmButtonColor: '#28643b',
          });
        },
      });
    });
  }
}
