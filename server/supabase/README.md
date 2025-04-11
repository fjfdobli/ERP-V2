# Supabase Edge Functions for Authentication

This directory contains Supabase Edge Functions used to support the authentication system in Opzon's Printing Press ERP.

## Functions

1. `send-email` - Sends verification codes and password reset emails
2. `send-sms` - Sends SMS verification codes using Twilio

## Setup and Deployment

### Prerequisites

1. Supabase CLI installed (https://supabase.com/docs/guides/cli)
2. Supabase project created
3. SMTP service (like Gmail) for sending emails
4. Twilio account for sending SMS (optional)

### Configuration

1. Edit the `config.toml` file and update the environment variables with your actual credentials:
   - SMTP settings for email delivery
   - Twilio credentials for SMS delivery

### Deploying Functions

1. Login to Supabase CLI:
   ```
   supabase login
   ```

2. Link to your Supabase project:
   ```
   supabase link --project-ref your-project-ref
   ```

3. Deploy the functions:
   ```
   supabase functions deploy send-email
   supabase functions deploy send-sms
   ```

### Testing Functions

You can test the functions using the Supabase CLI:

**Email Function:**
```
supabase functions serve send-email --env-file ./config.env
```

Then use curl to test:
```
curl -X POST http://localhost:54321/functions/v1/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com", "type": "email_verification", "code": "123456"}'
```

**SMS Function:**
```
supabase functions serve send-sms --env-file ./config.env
```

Then use curl to test:
```
curl -X POST http://localhost:54321/functions/v1/send-sms \
  -H "Content-Type: application/json" \
  -d '{"to":"+1234567890", "message": "Your verification code is: 123456"}'
```

## Security

- These functions require JWT authentication when deployed
- Make sure to keep your credentials secure
- For production, use secure secrets management instead of config.toml