import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE OR REPLACE FUNCTION reservations_sync_session_state()
  RETURNS trigger
  LANGUAGE plpgsql
  AS $$
  DECLARE
    sid integer;
    session_capacity numeric;
    session_state text;
    occupied numeric;
  BEGIN
    sid := COALESCE(NEW.session_id, OLD.session_id);
    IF sid IS NULL THEN
      RETURN COALESCE(NEW, OLD);
    END IF;

    SELECT capacity, state::text INTO session_capacity, session_state
    FROM sessions
    WHERE id = sid;

    IF session_state IS NULL OR session_state = 'cancelled' OR session_capacity IS NULL THEN
      RETURN COALESCE(NEW, OLD);
    END IF;

    SELECT COALESCE(SUM(participants), 0) INTO occupied
    FROM reservations
    WHERE session_id = sid
      AND (
        status = 'confirmed'
        OR (status = 'held' AND held_until IS NOT NULL AND held_until > NOW())
      );

    UPDATE sessions
    SET state = CASE WHEN occupied >= session_capacity THEN 'full'::enum_sessions_state ELSE 'scheduled'::enum_sessions_state END,
        updated_at = NOW()
    WHERE id = sid
      AND state <> 'cancelled'
      AND state IS DISTINCT FROM CASE WHEN occupied >= session_capacity THEN 'full'::enum_sessions_state ELSE 'scheduled'::enum_sessions_state END;

    RETURN COALESCE(NEW, OLD);
  END;
  $$;

  DROP TRIGGER IF EXISTS reservations_sync_session_state_trigger ON reservations;
  CREATE TRIGGER reservations_sync_session_state_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reservations
  FOR EACH ROW
  EXECUTE PROCEDURE reservations_sync_session_state();
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TRIGGER IF EXISTS reservations_sync_session_state_trigger ON reservations;
  DROP FUNCTION IF EXISTS reservations_sync_session_state();
  `)
}
