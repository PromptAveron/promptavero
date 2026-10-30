alter table public.prompt_images
  add column if not exists imagekit_file_id text unique;
