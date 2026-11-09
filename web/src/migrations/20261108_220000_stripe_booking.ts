import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_reservations_payment_mode" AS ENUM('none', 'deposit', 'full');
  CREATE TYPE "public"."enum_reservations_payment_status" AS ENUM('unpaid', 'pending', 'paid', 'failed', 'exception');
  ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "payment_mode" "enum_reservations_payment_mode" DEFAULT 'none';
  ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "payment_status" "enum_reservations_payment_status" DEFAULT 'unpaid';
  ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "stripe_checkout_session_id" varchar;
  ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "stripe_payment_intent_id" varchar;
  ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "confirmation_email_sent_at" timestamp(3) with time zone;
  CREATE INDEX IF NOT EXISTS "reservations_payment_status_idx" ON "reservations" USING btree ("payment_status");
  CREATE INDEX IF NOT EXISTS "reservations_stripe_checkout_session_id_idx" ON "reservations" USING btree ("stripe_checkout_session_id");

  CREATE TABLE IF NOT EXISTS "stripe_webhook_events" (
    "event_id" varchar PRIMARY KEY NOT NULL,
    "event_type" varchar NOT NULL,
    "processed_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE IF EXISTS "stripe_webhook_events";
  DROP INDEX IF EXISTS "reservations_stripe_checkout_session_id_idx";
  DROP INDEX IF EXISTS "reservations_payment_status_idx";
  ALTER TABLE "reservations" DROP COLUMN IF EXISTS "confirmation_email_sent_at";
  ALTER TABLE "reservations" DROP COLUMN IF EXISTS "stripe_payment_intent_id";
  ALTER TABLE "reservations" DROP COLUMN IF EXISTS "stripe_checkout_session_id";
  ALTER TABLE "reservations" DROP COLUMN IF EXISTS "payment_status";
  ALTER TABLE "reservations" DROP COLUMN IF EXISTS "payment_mode";
  DROP TYPE IF EXISTS "public"."enum_reservations_payment_status";
  DROP TYPE IF EXISTS "public"."enum_reservations_payment_mode";
  `)
}
