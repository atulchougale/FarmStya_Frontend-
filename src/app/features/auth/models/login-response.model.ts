export interface LoginResponse {
  accessToken: string;

  refreshToken: string;

  userId: number;

  fullName: string;

  email: string;

  mobileNumber: string;

  farmHouseId: number;

  farmHouseName: string;

  roleId: number;

  roleName: string;

  isOwner: boolean;

  // Verification Status
  isEmailVerified: boolean;

  isMobileVerified: boolean;
}
