export interface ContactResponseDto {
  contactId: number;
  fullName: string;
  mobileNo: string;
  email?: string | null;
  enquiryType?: string;
  message: string;
  farmHouseId: number;
}