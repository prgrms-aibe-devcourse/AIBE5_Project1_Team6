-- Create a table for storing trip plans
create table if not exists trips (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Link to auth.users if logged in (optional)
  user_id uuid references auth.users(id),
  
  -- Guest ID for non-logged in users (optional)
  guest_id text,
  
  -- The actual trip data (transport, themes, budget, etc.)
  trip_data jsonb not null,
  
  -- Constraint to ensure at least one identifier is present
  constraint users_or_guests check (
    (user_id is not null) or (guest_id is not null)
  )
);

-- Enable Row Level Security (RLS)
alter table trips enable row level security;

-- Policy: Users can see their own trips
create policy "Users can view their own trips"
  on trips for select
  using ( auth.uid() = user_id );

-- Policy: Users can insert their own trips
create policy "Users can insert their own trips"
  on trips for insert
  with check ( auth.uid() = user_id );

-- Policy: Guests can insert trips (Conceptually, anyone with theanon key can insert if they provide a guest_id)
-- Note: For a real guest flow without auth, we might need to allow public inserts or use a specific function.
-- For simplicity in this demo, we allow public insert if guest_id is present.
create policy "Anyone can insert trips with guest_id"
  on trips for insert
  with check ( guest_id is not null );
