
-- Stagger cron jobs to prevent pool exhaustion.
-- Strategy: keep only 1 job at each shared minute mark; offset the rest.

-- Every-minute jobs: keep engagement-spikes (34) at :every, spread the rest
SELECT cron.alter_job(30, schedule => '2-59/3 * * * *');   -- reaper: every 3 min, offset 2
SELECT cron.alter_job(35, schedule => '1-59/2 * * * *');   -- superscale-publish: odd minutes
SELECT cron.alter_job(36, schedule => '0-59/2 * * * *');   -- superscale-auto-comments: even minutes (still collides with drain */2 but drain runs every 2min anyway; move drain to odd)

-- Drain: move off :00 mark
SELECT cron.alter_job(32, schedule => '1-59/2 * * * *');   -- drain-signal-agent-tasks: odd minutes

-- 5-min jobs: keep process-ai-replies (21) but shift off :00
SELECT cron.alter_job(21, schedule => '3-59/5 * * * *');

-- 30-min jobs: split
SELECT cron.alter_job(27, schedule => '7,37 * * * *');     -- process-campaign-followups
SELECT cron.alter_job(28, schedule => '22,52 * * * *');    -- send-connection-requests

-- Hourly winback: off :00
SELECT cron.alter_job(33, schedule => '17 * * * *');

-- Daily jobs colliding at :00 of the hour → stagger by minute
SELECT cron.alter_job(22, schedule => '5 7 * * *');        -- process-signal-agents-07
SELECT cron.alter_job(10, schedule => '15 8 * * *');       -- poll-reddit-signals-morning
SELECT cron.alter_job(23, schedule => '5 9 * * *');        -- process-signal-agents-09
SELECT cron.alter_job(13, schedule => '20 9 * * *');       -- poll-x-signals-morning
SELECT cron.alter_job(24, schedule => '5 12 * * *');       -- process-signal-agents-12
SELECT cron.alter_job(25, schedule => '5 15 * * *');       -- process-signal-agents-15
SELECT cron.alter_job(26, schedule => '5 18 * * *');       -- process-signal-agents-18
SELECT cron.alter_job(11, schedule => '20 18 * * *');      -- poll-reddit-signals-evening
SELECT cron.alter_job(14, schedule => '20 19 * * *');      -- poll-x-signals-evening
