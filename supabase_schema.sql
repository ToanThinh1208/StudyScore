-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE
create table profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  fpt_student_code text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table profiles enable row level security;

create policy "Users can view their own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);

-- SEMESTERS TABLE
create table semesters (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  index_order int not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table semesters enable row level security;

create policy "Users can view their own semesters" on semesters
  for select using (auth.uid() = user_id);

create policy "Users can insert their own semesters" on semesters
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own semesters" on semesters
  for update using (auth.uid() = user_id);

create policy "Users can delete their own semesters" on semesters
  for delete using (auth.uid() = user_id);

-- COURSES TABLE
create table courses (
  id uuid default uuid_generate_v4() primary key,
  semester_id uuid references semesters on delete cascade not null,
  user_id uuid references auth.users not null,
  name text not null,
  credit int not null default 3,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table courses enable row level security;

create policy "Users can view their own courses" on courses
  for select using (auth.uid() = user_id);

create policy "Users can insert their own courses" on courses
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own courses" on courses
  for update using (auth.uid() = user_id);

create policy "Users can delete their own courses" on courses
  for delete using (auth.uid() = user_id);

-- COURSE COMPONENTS TABLE
create table course_components (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references courses on delete cascade not null,
  name text not null, -- e.g., 'FE', 'PE', 'LAB'
  weight numeric not null, -- Percentage, e.g., 40 for 40%
  score numeric default 0, -- Score achieved, 0-10
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS for course_components is a bit tricky since it doesn't have user_id directly.
-- We can check via the course_id.
alter table course_components enable row level security;

create policy "Users can view their own course components" on course_components
  for select using (
    exists (
      select 1 from courses
      where courses.id = course_components.course_id
      and courses.user_id = auth.uid()
    )
  );

create policy "Users can insert their own course components" on course_components
  for insert with check (
    exists (
      select 1 from courses
      where courses.id = course_components.course_id
      and courses.user_id = auth.uid()
    )
  );

create policy "Users can update their own course components" on course_components
  for update using (
    exists (
      select 1 from courses
      where courses.id = course_components.course_id
      and courses.user_id = auth.uid()
    )
  );

create policy "Users can delete their own course components" on course_components
  for delete using (
    exists (
      select 1 from courses
      where courses.id = course_components.course_id
      and courses.user_id = auth.uid()
    )
  );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, fpt_student_code)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'fpt_student_code');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
