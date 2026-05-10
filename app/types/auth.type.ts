export type AuthStatus =
  | "idle"
  | "sending_otp"
  | "otp_sent"
  | "verifying"
  | "success"
  | "error"
  | "social_signin"
  | "resending_otp";