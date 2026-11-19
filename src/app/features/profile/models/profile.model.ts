export interface Profile {
  userId: number;
  fullName: string;
  email: string;
  hasEmail: boolean;
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  mobileNumber: string;
  farmHouseId: number;
  farmHouseName: string;
  roleId: number;
  roleName: string;
  isOwner: boolean;
}