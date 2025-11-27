-- 1. Ensure avatar_url column exists in profiles table
alter table public.profiles add column if not exists avatar_url text;

-- 2. Update the handle_new_user function to include avatar_url
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, fpt_student_code, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'fpt_student_code',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- 3. Ensure the trigger is active (it should already be, but good to double check)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
