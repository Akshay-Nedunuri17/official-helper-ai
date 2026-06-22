
ALTER TABLE public.schemes
  ADD COLUMN IF NOT EXISTS gender text DEFAULT 'All',
  ADD COLUMN IF NOT EXISTS min_age int,
  ADD COLUMN IF NOT EXISTS max_age int,
  ADD COLUMN IF NOT EXISTS income_limit bigint,
  ADD COLUMN IF NOT EXISTS occupation text,
  ADD COLUMN IF NOT EXISTS caste_categories text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS minority_only boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS official_url text,
  ADD COLUMN IF NOT EXISTS last_updated date DEFAULT CURRENT_DATE;

CREATE INDEX IF NOT EXISTS schemes_state_idx ON public.schemes (state);
CREATE INDEX IF NOT EXISTS schemes_category_idx ON public.schemes (category);
CREATE INDEX IF NOT EXISTS schemes_gender_idx ON public.schemes (gender);
CREATE INDEX IF NOT EXISTS schemes_occupation_idx ON public.schemes (occupation);
