-- Add 'link' column to notifications table if it doesn't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'notifications' and column_name = 'link') then
        alter table public.notifications add column link text;
    end if;
end $$;

-- Force schema cache reload (usually automatic, but changing schema helps)
notify pgrst, 'reload config';
