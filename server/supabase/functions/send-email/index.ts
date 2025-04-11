// Supabase Edge Function for sending emails
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts';

// Get email service credentials from environment variables
const SMTP_USERNAME = Deno.env.get('SMTP_USERNAME') || 'fjfdobli@addu.edu.ph';
const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD') || 'Ferdinandj0hnD!1';
const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com';
const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '587');
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'noreply@opzons-printing.com';
const EMAIL_FROM_NAME = Deno.env.get('EMAIL_FROM_NAME') || "Opzon's Printing Press";

// Create SMTP client
const client = new SmtpClient();

// Email templates
const emailTemplates = {
  email_verification: (code: string) => ({
    subject: "Verify Your Email - Opzon's Printing Press",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #1976d2;">Opzon's Printing Press</h1>
          <p style="color: #666;">Enterprise Resource Planning System</p>
        </div>
        
        <h2>Email Verification</h2>
        <p>Thank you for registering with Opzon's Printing Press ERP System. To verify your email address, please use the following verification code:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; text-align: center; border-radius: 4px;">
          <h2 style="margin: 0; color: #1976d2; letter-spacing: 2px;">${code}</h2>
        </div>
        
        <p>This code will expire in 30 minutes. If you did not request this verification, please ignore this email.</p>
        
        <p style="margin-top: 30px; font-size: 14px; color: #999; text-align: center;">
          © ${new Date().getFullYear()} Opzon's Printing Press. All rights reserved.
        </p>
      </div>
    `
  }),
  
  password_reset_request: () => ({
    subject: "Password Reset Request - Opzon's Printing Press",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #1976d2;">Opzon's Printing Press</h1>
          <p style="color: #666;">Enterprise Resource Planning System</p>
        </div>
        
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your password for the Opzon's Printing Press ERP System.</p>
        
        <p>You should receive another email from our authentication service with a link to reset your password. If you don't see it, please check your spam folder.</p>
        
        <p>This link will expire in 24 hours. If you did not request a password reset, please ignore these emails or contact support if you have concerns.</p>
        
        <p style="margin-top: 30px; font-size: 14px; color: #999; text-align: center;">
          © ${new Date().getFullYear()} Opzon's Printing Press. All rights reserved.
        </p>
      </div>
    `
  }),
  
  password_reset_success: () => ({
    subject: "Password Reset Successful - Opzon's Printing Press",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #1976d2;">Opzon's Printing Press</h1>
          <p style="color: #666;">Enterprise Resource Planning System</p>
        </div>
        
        <h2>Password Reset Successful</h2>
        <p>Your password for the Opzon's Printing Press ERP System has been successfully reset.</p>
        
        <p>You can now log in with your new password. If you did not make this change, please contact support immediately.</p>
        
        <p style="margin-top: 30px; font-size: 14px; color: #999; text-align: center;">
          © ${new Date().getFullYear()} Opzon's Printing Press. All rights reserved.
        </p>
      </div>
    `
  })
};

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Serve HTTP requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Parse the request body
    const { to, subject, code, type } = await req.json();
    
    // Validate required fields
    if (!to || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get email template based on type
    let emailContent;
    switch (type) {
      case 'email_verification':
        if (!code) {
          return new Response(
            JSON.stringify({ error: 'Verification code is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        emailContent = emailTemplates.email_verification(code);
        break;
      case 'password_reset_request':
        emailContent = emailTemplates.password_reset_request();
        break;
      case 'password_reset_success':
        emailContent = emailTemplates.password_reset_success();
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid email type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    
    // Connect to SMTP server
    await client.connect({
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      username: SMTP_USERNAME,
      password: SMTP_PASSWORD,
    });
    
    // Send email
    await client.send({
      from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
      to: to,
      subject: subject || emailContent.subject,
      content: emailContent.body,
      html: emailContent.body,
    });
    
    // Close connection
    await client.close();
    
    // Return success response
    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Log and return error
    console.error('Email sending error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to send email', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});