/*
  # Create maintenance timer table

  1. New Tables
    - `maintenance_timer`
      - `id` (text, primary key) - Always 'current' for singleton
      - `start_time` (timestamptz) - When the 15-hour countdown started
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
  
  2. Purpose
    - Stores the start time of the maintenance countdown timer
    - Persists across page reloads and device access
    - Single record with id='current' for singleton pattern
  
  3. Security
    - Enable RLS on `maintenance_timer` table
    - Add policy for public read access (needed for countdown display)
    - No write policies (only server/admin should write)
*/

CREATE TABLE IF NOT EXISTS maintenance_timer (
  id text PRIMARY KEY DEFAULT 'current',
  start_time timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE maintenance_timer ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read maintenance timer"
  ON maintenance_timer
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Insert initial record with current timestamp
INSERT INTO maintenance_timer (id, start_time)
VALUES ('current', now())
ON CONFLICT (id) DO NOTHING;