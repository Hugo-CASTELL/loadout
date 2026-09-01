-- OPTIONAL: requires the pg_cron extension (see backend/db/Dockerfile)
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $cron$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'delete-expired-inventories'
  ) THEN
    PERFORM cron.schedule(
      'delete-expired-inventories',
      '0 * * * *',
      'DELETE FROM inventories WHERE expires_at < NOW()'
    );
  END IF;
END
$cron$;
