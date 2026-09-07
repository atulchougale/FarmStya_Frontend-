export interface ResetPasswordEmailRequest {
  userId: number;
  token: string;
  newPassword: string;
  confirmPassword: string;
}