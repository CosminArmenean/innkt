-- Check for active transactions
SELECT pid, state, query FROM pg_stat_activity WHERE datname = 'innkt_social';

-- Check current schema
SELECT current_schema();

-- Check if there are any uncommitted transactions
SELECT * FROM pg_stat_activity WHERE state = 'active' AND datname = 'innkt_social';

-- Try to see what the service sees
SELECT count(*)::int FROM "Posts" AS p;
