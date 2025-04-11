# Authentication System Documentation

This document outlines the authentication system implemented for Opzon's Printing Press ERP.

## Technology Stack

- **Frontend**: React with Redux Toolkit
- **Backend**: Supabase Authentication & Database
- **Email Delivery**: Custom SMTP integration via Supabase Edge Functions
- **SMS Delivery**: Twilio integration via Supabase Edge Functions

## Features

### 1. User Registration

- Email/password registration
- Required fields: First Name, Last Name, Email, Phone, Password
- Email verification via verification code
- Phone verification via SMS code
- Strong password requirements

### 2. Login

- Email/password login
- Phone/password login (using the associated email account)
- "Remember me" functionality
- Session persistence

### 3. Verification

- Email verification using 6-digit codes
- SMS verification using 6-digit codes
- Verification status tracking
- Resend verification code functionality
- Configurable expiration time (default: 30 minutes)

### 4. Password Management

- Forgot password functionality
- Password reset via email link
- Password strength requirements
- Password change functionality in user profile

### 5. Session Management

- Automatic token refresh
- Secure token storage
- Session expiration handling
- Logout on all devices option

## Authentication Flow

### Registration Flow

1. User enters registration details
2. Form validation and password strength check
3. Send verification code to email
4. User enters verification code
5. Send verification code to phone
6. User enters SMS verification code
7. Create user account with verified email and phone
8. Redirect to login page

### Login Flow

1. User enters email/phone and password
2. Validate credentials
3. If credentials are valid but email/phone not verified, request verification
4. Issue access and refresh tokens for validated users
5. Store authentication state
6. Redirect to dashboard

### Password Reset Flow

1. User requests password reset
2. System sends reset link to user's email
3. User clicks link and enters new password
4. System validates token and updates password
5. User redirected to login page

## Implementation Details

### Key Files

- `authSlice.ts`: Redux slice for authentication state management
- `Login.tsx`: Login screen with verification handling
- `Register.tsx`: Registration flow and verification
- `ResetPassword.tsx`: Password reset functionality
- `AuthConfirm.tsx`: Email confirmation handling
- `supabaseClient.ts`: Supabase client configuration

### Supabase Configuration

- Authentication settings:
  - Email signups enabled
  - Email confirmations enabled
  - Phone auth configured with Twilio (optional)
  - Password recovery enabled

### Edge Functions

- `send-email`: Edge function for sending verification codes and password reset emails
- `send-sms`: Edge function for sending SMS verification codes

### Database Tables

- `verification_codes`: Stores verification codes for email and SMS
- `profiles`: Additional user information linked to auth.users

## Security Considerations

- Verification codes expire after 30 minutes
- Failed login attempts are rate-limited
- Passwords must meet complexity requirements
- JWT tokens with short expiration time
- Row-level security policies on user data
- No sensitive information in client-side code

## Testing

To test the authentication system:

1. Create a test user account
2. Verify email and phone
3. Test login functionality
4. Test password reset
5. Validate session persistence
6. Test token refresh

## Troubleshooting

Common issues:

- Verification emails not arriving: Check spam folders, verify SMTP settings
- SMS not arriving: Verify Twilio configuration, check phone format
- Login issues: Ensure email/phone is verified
- Token expiration: Refresh token or reauthenticate

## Future Enhancements

- Google OAuth integration
- Single Sign-On (SSO) options
- TOTP-based two-factor authentication
- WebAuthn support for passwordless login