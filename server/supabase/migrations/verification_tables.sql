-- Table for storing verification codes (email and SMS)
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR,
  phone VARCHAR,
  code VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verification ON public.verification_codes(email, code) WHERE type = 'email';
CREATE INDEX IF NOT EXISTS idx_phone_verification ON public.verification_codes(phone, code) WHERE type = 'phone';

-- Create a profiles table to store additional user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) NOT NULL,
  first_name VARCHAR,
  last_name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  job_title VARCHAR,
  avatar_url VARCHAR,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create an index on auth_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON public.profiles(auth_id);

-- Create a secure function to automatically populate the profiles table when a new user is created
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (auth_id, first_name, last_name, email, phone, email_verified, phone_verified)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'firstName', 
    NEW.raw_user_meta_data->>'lastName', 
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'emailVerified')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'phoneVerified')::boolean, false)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a secure function to update profile when user metadata changes
CREATE OR REPLACE FUNCTION public.handle_user_update() 
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    first_name = NEW.raw_user_meta_data->>'firstName',
    last_name = NEW.raw_user_meta_data->>'lastName',
    phone = NEW.raw_user_meta_data->>'phone',
    email_verified = COALESCE((NEW.raw_user_meta_data->>'emailVerified')::boolean, profiles.email_verified),
    phone_verified = COALESCE((NEW.raw_user_meta_data->>'phoneVerified')::boolean, profiles.phone_verified),
    updated_at = NOW()
  WHERE auth_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a user is updated
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- Create an RLS policy to allow users to view only their own profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = auth_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = auth_id);

-- Create policy for verification codes to allow users to insert their own codes
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert verification codes" ON public.verification_codes;
CREATE POLICY "Users can insert verification codes" ON public.verification_codes 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own verification codes" ON public.verification_codes;
CREATE POLICY "Users can view their own verification codes" ON public.verification_codes 
  FOR SELECT USING (
    (email IS NOT NULL AND email = (SELECT email FROM auth.users WHERE id = auth.uid())) OR
    (phone IS NOT NULL AND phone = (SELECT raw_user_meta_data->>'phone' FROM auth.users WHERE id = auth.uid()))
  );

-- Create a policy that allows users to update their own verification codes (mark as used)
DROP POLICY IF EXISTS "Users can update their own verification codes" ON public.verification_codes;
CREATE POLICY "Users can update their own verification codes" ON public.verification_codes 
  FOR UPDATE USING (
    (email IS NOT NULL AND email = (SELECT email FROM auth.users WHERE id = auth.uid())) OR
    (phone IS NOT NULL AND phone = (SELECT raw_user_meta_data->>'phone' FROM auth.users WHERE id = auth.uid()))
  );