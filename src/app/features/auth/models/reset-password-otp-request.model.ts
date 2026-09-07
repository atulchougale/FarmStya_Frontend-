export interface ResetPasswordOtpRequest {
  mobileNumber: string;
  otpCode: string;
  newPassword: string;
  confirmPassword: string;
}