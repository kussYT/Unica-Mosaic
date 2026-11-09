import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE OR REPLACE FUNCTION reservations_enforce_capacity()
  RETURNS trigger
  LANGUAGE plpgsql
  AS $$
  DECLARE
    session_state text;
    session_capacity numeric;
    occupied numeric;
  BEGIN
    UPDATE reservations
    SET status = 'expired',
        expired_at = COALESCE(expired_at, NOW()),
        updated_at = NOW()
    WHERE session_id = NEW.session_id
      AND status = 'held'
      AND held_until IS NOT NULL
      AND held_until <= NOW()
      AND id IS DISTINCT FROM NEW.id;

    IF NEW.status = 'held' AND (NEW.held_until IS NULL OR NEW.held_until <= NOW()) THEN
      NEW.status := 'expired';
      NEW.expired_at := COALESCE(NEW.expired_at, NOW());
      RETURN NEW;
    END IF;

    SELECT state::text, capacity INTO session_state, session_capacity
    FROM sessions
    WHERE id = NEW.session_id
    FOR UPDATE;

    IF session_state IS NULL THEN
      RAISE EXCEPTION 'Session introuvable.';
    END IF;

    IF session_state = 'cancelled' AND NEW.status IN ('confirmed', 'held') THEN
      RAISE EXCEPTION 'Cette session est annulée.';
    END IF;

    IF NEW.status NOT IN ('confirmed', 'held') THEN
      RETURN NEW;
    END IF;

    IF session_capacity IS NULL THEN
      RAISE EXCEPTION 'La capacité de la session n’est pas définie.';
    END IF;

    SELECT COALESCE(SUM(participants), 0) INTO occupied
    FROM reservations
    WHERE session_id = NEW.session_id
      AND id IS DISTINCT FROM NEW.id
      AND (
        status = 'confirmed'
        OR (status = 'held' AND held_until IS NOT NULL AND held_until > NOW())
      );

    IF occupied + NEW.participants > session_capacity THEN
      RAISE EXCEPTION 'Plus assez de places disponibles pour cette session.';
    END IF;

    RETURN NEW;
  END;
  $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  CREATE OR REPLACE FUNCTION reservations_enforce_capacity()
  RETURNS trigger
  LANGUAGE plpgsql
  AS $$
  DECLARE
    session_state text;
    session_capacity numeric;
    occupied numeric;
  BEGIN
    UPDATE reservations
    SET status = 'expired',
        expired_at = COALESCE(expired_at, NOW()),
        updated_at = NOW()
    WHERE session_id = NEW.session_id
      AND status = 'held'
      AND held_until IS NOT NULL
      AND held_until <= NOW()
      AND id IS DISTINCT FROM NEW.id;

    SELECT state::text, capacity INTO session_state, session_capacity
    FROM sessions
    WHERE id = NEW.session_id
    FOR UPDATE;

    IF session_state IS NULL THEN
      RAISE EXCEPTION 'Session introuvable.';
    END IF;

    IF session_state = 'cancelled' AND NEW.status IN ('confirmed', 'held') THEN
      RAISE EXCEPTION 'Cette session est annulée.';
    END IF;

    IF NEW.status NOT IN ('confirmed', 'held') THEN
      RETURN NEW;
    END IF;

    IF NEW.status = 'held' AND (NEW.held_until IS NULL OR NEW.held_until <= NOW()) THEN
      RAISE EXCEPTION 'Une retenue doit avoir une date d’expiration future.';
    END IF;

    IF session_capacity IS NULL THEN
      RAISE EXCEPTION 'La capacité de la session n’est pas définie.';
    END IF;

    SELECT COALESCE(SUM(participants), 0) INTO occupied
    FROM reservations
    WHERE session_id = NEW.session_id
      AND id IS DISTINCT FROM NEW.id
      AND (
        status = 'confirmed'
        OR (status = 'held' AND held_until IS NOT NULL AND held_until > NOW())
      );

    IF occupied + NEW.participants > session_capacity THEN
      RAISE EXCEPTION 'Plus assez de places disponibles pour cette session.';
    END IF;

    RETURN NEW;
  END;
  $$;
  `)
}
