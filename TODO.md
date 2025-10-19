# Fix OTP Verification Bug

## Tasks
- [x] Remove authorization header check from supabase/functions/verify-otp/index.ts
- [x] Adjust error handling in catch block to remove authorization-related status code logic
- [x] Fix environment variable names in verify-otp function
- [x] Test the fix by verifying OTP works correctly

# Add Password Visibility Toggle

## Tasks
- [x] Add state for password visibility in ForgotPassword.tsx
- [x] Update password input types to toggle between password and text
- [x] Add eye icons next to password fields for toggling visibility
