-- Create table for storing plans
create table if not exists plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  subtitle text,
  image text,
  nights int default 1,
  people int default 2,
  plan_text text,
  lat float,
  lon float,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table plans enable row level security;

-- Create policy to allow users to see and manage only their own plans
create policy "Users can view their own plans" on plans
  for select using (auth.uid() = user_id);

create policy "Users can insert their own plans" on plans
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own plans" on plans
  for update using (auth.uid() = user_id);

create policy "Users can delete their own plans" on plans
  for delete using (auth.uid() = user_id);
