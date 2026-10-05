import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';

import Swal from 'sweetalert2';

import { ContactResponseDto } from '../models/message.model';
import { MessageService } from '../../../../core/services/message.service';

@Component({
  selector: 'app-contact-messages',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
  ],
  templateUrl: './contact-messages.component.html',
  styleUrl: './contact-messages.component.css',
})
export class ContactMessagesComponent implements OnInit, AfterViewInit {
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
    this.messageService.getContactAll().subscribe({
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
          title: 'Unable to Load Messages',
          text: 'Contact messages could not be loaded. Please try again.',
          confirmButtonText: 'OK',
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

    if (!message) {
      return;
    }

    Swal.fire({
      title: 'Delete Message?',
      text: `Are you sure you want to delete the message from ${message.fullName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: '#c74747',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.messageService.deleteContact(contactId).subscribe({
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
              title: 'Deleted!',
              text: 'Contact message has been deleted successfully.',
              confirmButtonText: 'OK',
              confirmButtonColor: '#28643b',
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Delete Failed',
              text: 'The contact message could not be deleted.',
              confirmButtonText: 'OK',
            });
          }
        },
        error: (error: Error) => {
          console.error('Error deleting contact message:', error);

          Swal.fire({
            icon: 'error',
            title: 'Delete Failed',
            text: 'An error occurred while deleting the message.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#28643b',
          });
        },
      });
    });
  }
}
