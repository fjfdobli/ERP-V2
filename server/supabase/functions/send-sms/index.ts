// Supabase Edge Function for sending SMS messages
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Get Twilio credentials from environment variables
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') || '';
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') || '';
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER') || '';

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
    const { to, message, type } = await req.json();
    
    // Validate required fields
    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: 'Phone number and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Clean the phone number for SMS delivery
    const cleanPhone = to.replace(/\s+/g, '');
    
    // Create Twilio request
    const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    
    // In development or when Twilio is not configured, just log the message
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.log(`[DEVELOPMENT] SMS to ${cleanPhone}: ${message}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'SMS logged (development mode)',
          development: true,
          sms: { to: cleanPhone, message }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Prepare form data for Twilio API
    const formData = new URLSearchParams();
    formData.append('To', cleanPhone);
    formData.append('From', TWILIO_PHONE_NUMBER);
    formData.append('Body', message);
    
    // Send request to Twilio
    const authorization = `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`;
    const response = await fetch(twilioEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authorization
      },
      body: formData.toString()
    });
    
    // Parse the Twilio response
    const twilioData = await response.json();
    
    if (response.ok) {
      // Return success response
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'SMS sent successfully',
          smsId: twilioData.sid 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Return Twilio error
      console.error('Twilio error:', twilioData);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send SMS', 
          details: twilioData.message || 'Twilio API error' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    // Log and return error
    console.error('SMS sending error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to send SMS', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});