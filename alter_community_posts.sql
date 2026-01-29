-- Add wellness metrics to community_posts table
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS noise_level smallint CHECK (noise_level BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS lighting_level smallint CHECK (lighting_level BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS congestion_level smallint CHECK (congestion_level BETWEEN 1 AND 5);

COMMENT ON COLUMN community_posts.noise_level IS '1: Very Quiet, 5: Very Noisy';
COMMENT ON COLUMN community_posts.lighting_level IS '1: Dark/Mood, 5: Very Bright';
COMMENT ON COLUMN community_posts.congestion_level IS '1: Empty, 5: Crowded';
