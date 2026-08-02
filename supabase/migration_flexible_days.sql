-- Migration: allow any day label (not just 'sunday'/'tuesday') on matches.
-- Run this once in the Supabase SQL editor if you already ran the original
-- schema.sql. Safe to run even if the constraint has a different name.

DO $$
DECLARE
  con text;
BEGIN
  SELECT conname INTO con
  FROM pg_constraint
  WHERE conrelid = 'matches'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%day_type%';

  IF con IS NOT NULL THEN
    EXECUTE format('ALTER TABLE matches DROP CONSTRAINT %I', con);
  END IF;
END $$;

-- Also drop the old (match_date, day_type) uniqueness rule — with free-text
-- day labels this isn't needed, and it was the cause of "can't create more
-- matches" once a date+label combo had already been used once (even if closed).
DO $$
DECLARE
  con text;
BEGIN
  SELECT conname INTO con
  FROM pg_constraint
  WHERE conrelid = 'matches'::regclass
    AND contype = 'u';

  IF con IS NOT NULL THEN
    EXECUTE format('ALTER TABLE matches DROP CONSTRAINT %I', con);
  END IF;
END $$;
