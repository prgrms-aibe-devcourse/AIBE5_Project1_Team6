-- Add missing columns to user_badges table
alter table public.user_badges 
add column if not exists earned boolean default false,
add column if not exists progress integer default 0,
add column if not exists goal integer default 0,
add column if not exists earned_at timestamp with time zone;

-- In case the table needs to be recreated fully (Optional, but using ALTER is safer for existing)
-- If the previous create didn't work effectively or you want to be sure:
comment on column public.user_badges.earned is 'Whether the badge is earned';
comment on column public.user_badges.progress is 'Current progress';
comment on column public.user_badges.goal is 'Goal to earn data';
