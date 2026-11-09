import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_reservations_status" AS ENUM('pending', 'held', 'confirmed', 'expired', 'cancelled');
  CREATE TYPE "public"."enum_reservations_origin" AS ENUM('manual', 'online');
  CREATE TABLE "reservations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"session_id" integer,
  	"first_name" varchar,
  	"last_name" varchar,
  	"email" varchar,
  	"phone" varchar,
  	"participants" numeric,
  	"status" "enum_reservations_status" DEFAULT 'confirmed',
  	"origin" "enum_reservations_origin" DEFAULT 'manual',
  	"total_cents" numeric DEFAULT 0,
  	"deposit_cents" numeric DEFAULT 0,
  	"paid_cents" numeric DEFAULT 0,
  	"balance_cents" numeric DEFAULT 0,
  	"held_until" timestamp(3) with time zone,
  	"confirmed_at" timestamp(3) with time zone,
  	"cancelled_at" timestamp(3) with time zone,
  	"expired_at" timestamp(3) with time zone,
  	"reschedule_to_id" integer,
  	"admin_note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  ALTER TABLE "reservations" ADD CONSTRAINT "reservations_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reservations" ADD CONSTRAINT "reservations_reschedule_to_id_sessions_id_fk" FOREIGN KEY ("reschedule_to_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "reservations_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reservations_fk" FOREIGN KEY ("reservations_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "reservations_session_idx" ON "reservations" USING btree ("session_id");
  CREATE INDEX "reservations_status_idx" ON "reservations" USING btree ("status");
  CREATE INDEX "reservations_updated_at_idx" ON "reservations" USING btree ("updated_at");
  CREATE INDEX "reservations_created_at_idx" ON "reservations" USING btree ("created_at");
  CREATE INDEX "reservations_held_until_idx" ON "reservations" USING btree ("held_until");
  CREATE INDEX "payload_locked_documents_rels_reservations_id_idx" ON "payload_locked_documents_rels" USING btree ("reservations_id");

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

    IF NEW.status = 'held' AND (NEW.held_until IS NULL OR NEW.held_until <= NOW()) THEN
      NEW.status := 'expired';
      NEW.expired_at := COALESCE(NEW.expired_at, NOW());
      RETURN NEW;
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

  CREATE TRIGGER reservations_enforce_capacity_trigger
  BEFORE INSERT OR UPDATE ON reservations
  FOR EACH ROW
  EXECUTE PROCEDURE reservations_enforce_capacity();

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
  DROP TRIGGER IF EXISTS reservations_enforce_capacity_trigger ON reservations;
  DROP FUNCTION IF EXISTS reservations_enforce_capacity();
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_reservations_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_reservations_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "reservations_id";
  DROP TABLE IF EXISTS "reservations" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_reservations_origin";
  DROP TYPE IF EXISTS "public"."enum_reservations_status";
  `)
}
