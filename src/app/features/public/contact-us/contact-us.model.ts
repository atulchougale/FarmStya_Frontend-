export interface ContactUsRequest {
  ContactId: number;
  FullName: string;
  MobileNo: string;
  Email: string | null;
  EnquiryType: string;
  Message: string;
  FarmHouseId: number;
}

export interface ContactUsResponse {
  contactId: number;
  farmHouseId: number;
  fullName: string;
  mobileNo: string;
  email: string | null;
  enquiryType: string;
  message: string;
}
