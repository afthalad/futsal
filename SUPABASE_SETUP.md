# Supabase Setup Guide

This guide will help you set up Supabase for your futsal booking application.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - Name: `futsal-booking`
   - Database Password: (choose a strong password)
   - Region: Choose closest to your users
6. Click "Create new project"

## 2. Get API Keys

1. Go to your project dashboard
2. Click on "Settings" in the sidebar
3. Click on "API"
4. Copy the following values:
   - Project URL
   - anon public key
   - service_role secret key

## 3. Set Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# SMS Configuration (Text.lk)
SMS_API_KEY=your_text_lk_api_key
SMS_SENDER_ID=your_sender_id
```

## 4. Create Database Tables

Run the following SQL in your Supabase SQL Editor:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'GROUND_OWNER', 'USER')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create grounds table
CREATE TABLE grounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  images TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  morning_price DECIMAL(10,2) NOT NULL,
  evening_price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  opening_time TIME NOT NULL,
  closing_time TIME NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ground_id UUID REFERENCES grounds(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  reason TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_grounds_owner_id ON grounds(owner_id);
CREATE INDEX idx_grounds_city ON grounds(city);
CREATE INDEX idx_grounds_is_active ON grounds(is_active);
CREATE INDEX idx_bookings_ground_id ON bookings(ground_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_date ON bookings(date);

-- Create storage bucket for ground images
INSERT INTO storage.buckets (id, name, public) VALUES ('ground-images', 'ground-images', true);

-- Set up Row Level Security policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE grounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid()::text = id::text);

-- Ground owners can manage their grounds
CREATE POLICY "Ground owners can manage own grounds" ON grounds FOR ALL USING (auth.uid()::text = owner_id::text);

-- Users can read active grounds
CREATE POLICY "Anyone can read active grounds" ON grounds FOR SELECT USING (is_active = true);

-- Users can create bookings
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (true);

-- Users can read their own bookings
CREATE POLICY "Users can read own bookings" ON bookings FOR SELECT USING (auth.uid()::text = user_id::text);

-- Ground owners can read bookings for their grounds
CREATE POLICY "Ground owners can read own ground bookings" ON bookings FOR SELECT USING (
  ground_id IN (
    SELECT id FROM grounds WHERE owner_id::text = auth.uid()::text
  )
);
```

## 5. Enable Phone Authentication

1. Go to Authentication > Settings in your Supabase dashboard
2. Enable "Phone" provider
3. Configure SMS settings:
   - For development: Use Supabase's built-in SMS (limited)
   - For production: Configure your own SMS provider

## 6. Create Storage Bucket

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `ground-images`
3. Make it public
4. Set up appropriate policies for image uploads

## 7. Create Super Admin User

After setting up the database, you can create a super admin user by running:

```bash
npm run setup-admin
```

Or manually insert in the SQL editor:

```sql
INSERT INTO users (phone, name, role, is_active) 
VALUES ('+94773078103', 'Super Admin', 'SUPER_ADMIN', true);
```

## 8. Test the Setup

1. Start your development server: `npm run dev`
2. Try to register a new user with phone authentication
3. Check if the user appears in the users table
4. Test creating a ground and booking

## Troubleshooting

### Common Issues:

1. **Phone authentication not working**: Check if phone provider is enabled in Supabase
2. **Database connection errors**: Verify your environment variables
3. **Storage upload errors**: Check bucket permissions and policies
4. **RLS policy errors**: Ensure policies are correctly set up

### Useful Commands:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Check environment variables
npm run test-env
```

## Production Considerations

1. **SMS Provider**: Set up a production SMS provider (Twilio, etc.)
2. **Database Backups**: Enable automatic backups
3. **Monitoring**: Set up monitoring and alerts
4. **Security**: Review and tighten RLS policies
5. **Performance**: Monitor query performance and add indexes as needed
