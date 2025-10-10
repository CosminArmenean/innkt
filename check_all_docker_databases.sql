-- Check all databases in Docker PostgreSQL
SELECT datname FROM pg_database WHERE datname LIKE '%innkt%' ORDER BY datname;
