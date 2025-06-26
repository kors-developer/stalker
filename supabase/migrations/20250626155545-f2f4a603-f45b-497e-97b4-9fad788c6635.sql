-- Create users table to store registered users
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL,
  consents JSONB NOT NULL DEFAULT '{}',
  location JSONB,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create admin sessions table to remember admin login
CREATE TABLE public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create entries table to store captured photos and logs
CREATE TABLE public.entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  photo_url TEXT,
  location JSONB,
  stream_url TEXT,
  webhook_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS (Row Level Security) but make tables publicly accessible for now
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (since we don't have auth yet)
CREATE POLICY "Allow public access to users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow public access to admin_sessions" ON public.admin_sessions FOR ALL USING (true);
CREATE POLICY "Allow public access to entries" ON public.entries FOR ALL USING (true);

-- Create function to update user location
CREATE OR REPLACE FUNCTION update_user_location(
  p_phone_number TEXT,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.users 
  SET 
    location = jsonb_build_object('latitude', p_latitude, 'longitude', p_longitude),
    last_seen = now(),
    updated_at = now()
  WHERE phone_number = p_phone_number;
END;
$$;
