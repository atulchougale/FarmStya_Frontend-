export interface PublicSite {
  farmHouseId: number;
  farmHouseName: string;
  domainName: string;
  subDomain?: string;
  isPrimaryDomain: boolean;

  tagLine?: string;
  description?: string;

  address: string;
  village?: string;
  taluka: string;
  district: string;
  state: string;
  pincode?: string;

  contactPersonName: string;
  ownerName: string;

  mobileNumber: string;
  alternateMobileNumber?: string;

  email: string;

  logoUrl?: string;
  coverImageUrl?: string;

  googleMapUrl?: string;

  latitude?: number;
  longitude?: number;
}