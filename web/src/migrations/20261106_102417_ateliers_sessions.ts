import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_workshops_tone" AS ENUM('pink', 'blush', 'plum', 'cream');
  CREATE TYPE "public"."enum_workshops_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__workshops_v_version_tone" AS ENUM('pink', 'blush', 'plum', 'cream');
  CREATE TYPE "public"."enum__workshops_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_sessions_state" AS ENUM('scheduled', 'full', 'cancelled');
  CREATE TYPE "public"."enum_sessions_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__sessions_v_version_state" AS ENUM('scheduled', 'full', 'cancelled');
  CREATE TYPE "public"."enum__sessions_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "workshops" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"label" varchar,
  	"summary" varchar,
  	"description" varchar,
  	"tone" "enum_workshops_tone" DEFAULT 'pink',
  	"price_cents" numeric,
  	"deposit_cents" numeric,
  	"duration_minutes" numeric,
  	"practical_info" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_workshops_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "workshops_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_workshops_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_label" varchar,
  	"version_summary" varchar,
  	"version_description" varchar,
  	"version_tone" "enum__workshops_v_version_tone" DEFAULT 'pink',
  	"version_price_cents" numeric,
  	"version_deposit_cents" numeric,
  	"version_duration_minutes" numeric,
  	"version_practical_info" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__workshops_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_workshops_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"workshop_id" integer,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"capacity" numeric,
  	"place" varchar,
  	"state" "enum_sessions_state" DEFAULT 'scheduled',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_sessions_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_sessions_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_workshop_id" integer,
  	"version_starts_at" timestamp(3) with time zone,
  	"version_ends_at" timestamp(3) with time zone,
  	"version_capacity" numeric,
  	"version_place" varchar,
  	"version_state" "enum__sessions_v_version_state" DEFAULT 'scheduled',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__sessions_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "workshops_rels" ADD CONSTRAINT "workshops_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_rels" ADD CONSTRAINT "workshops_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v" ADD CONSTRAINT "_workshops_v_parent_id_workshops_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."workshops"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshops_v_rels" ADD CONSTRAINT "_workshops_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_workshops_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_rels" ADD CONSTRAINT "_workshops_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sessions_v" ADD CONSTRAINT "_sessions_v_parent_id_sessions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sessions_v" ADD CONSTRAINT "_sessions_v_version_workshop_id_workshops_id_fk" FOREIGN KEY ("version_workshop_id") REFERENCES "public"."workshops"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "workshops_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "sessions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sessions_fk" FOREIGN KEY ("sessions_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "workshops_slug_idx" ON "workshops" USING btree ("slug");
  CREATE INDEX "workshops_updated_at_idx" ON "workshops" USING btree ("updated_at");
  CREATE INDEX "workshops_created_at_idx" ON "workshops" USING btree ("created_at");
  CREATE INDEX "workshops__status_idx" ON "workshops" USING btree ("_status");
  CREATE INDEX "workshops_rels_order_idx" ON "workshops_rels" USING btree ("order");
  CREATE INDEX "workshops_rels_parent_idx" ON "workshops_rels" USING btree ("parent_id");
  CREATE INDEX "workshops_rels_path_idx" ON "workshops_rels" USING btree ("path");
  CREATE INDEX "workshops_rels_media_id_idx" ON "workshops_rels" USING btree ("media_id");
  CREATE INDEX "_workshops_v_parent_idx" ON "_workshops_v" USING btree ("parent_id");
  CREATE INDEX "_workshops_v_version_version_slug_idx" ON "_workshops_v" USING btree ("version_slug");
  CREATE INDEX "_workshops_v_version_version_updated_at_idx" ON "_workshops_v" USING btree ("version_updated_at");
  CREATE INDEX "_workshops_v_version_version_created_at_idx" ON "_workshops_v" USING btree ("version_created_at");
  CREATE INDEX "_workshops_v_version_version__status_idx" ON "_workshops_v" USING btree ("version__status");
  CREATE INDEX "_workshops_v_created_at_idx" ON "_workshops_v" USING btree ("created_at");
  CREATE INDEX "_workshops_v_updated_at_idx" ON "_workshops_v" USING btree ("updated_at");
  CREATE INDEX "_workshops_v_latest_idx" ON "_workshops_v" USING btree ("latest");
  CREATE INDEX "_workshops_v_rels_order_idx" ON "_workshops_v_rels" USING btree ("order");
  CREATE INDEX "_workshops_v_rels_parent_idx" ON "_workshops_v_rels" USING btree ("parent_id");
  CREATE INDEX "_workshops_v_rels_path_idx" ON "_workshops_v_rels" USING btree ("path");
  CREATE INDEX "_workshops_v_rels_media_id_idx" ON "_workshops_v_rels" USING btree ("media_id");
  CREATE INDEX "sessions_workshop_idx" ON "sessions" USING btree ("workshop_id");
  CREATE INDEX "sessions_updated_at_idx" ON "sessions" USING btree ("updated_at");
  CREATE INDEX "sessions_created_at_idx" ON "sessions" USING btree ("created_at");
  CREATE INDEX "sessions__status_idx" ON "sessions" USING btree ("_status");
  CREATE INDEX "_sessions_v_parent_idx" ON "_sessions_v" USING btree ("parent_id");
  CREATE INDEX "_sessions_v_version_version_workshop_idx" ON "_sessions_v" USING btree ("version_workshop_id");
  CREATE INDEX "_sessions_v_version_version_updated_at_idx" ON "_sessions_v" USING btree ("version_updated_at");
  CREATE INDEX "_sessions_v_version_version_created_at_idx" ON "_sessions_v" USING btree ("version_created_at");
  CREATE INDEX "_sessions_v_version_version__status_idx" ON "_sessions_v" USING btree ("version__status");
  CREATE INDEX "_sessions_v_created_at_idx" ON "_sessions_v" USING btree ("created_at");
  CREATE INDEX "_sessions_v_updated_at_idx" ON "_sessions_v" USING btree ("updated_at");
  CREATE INDEX "_sessions_v_latest_idx" ON "_sessions_v" USING btree ("latest");
  CREATE INDEX "payload_locked_documents_rels_workshops_id_idx" ON "payload_locked_documents_rels" USING btree ("workshops_id");
  CREATE INDEX "payload_locked_documents_rels_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("sessions_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_workshops_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_sessions_fk";
  DROP INDEX "payload_locked_documents_rels_workshops_id_idx";
  DROP INDEX "payload_locked_documents_rels_sessions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "workshops_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "sessions_id";
  DROP TABLE "workshops_rels" CASCADE;
  DROP TABLE "_workshops_v_rels" CASCADE;
  DROP TABLE "_workshops_v" CASCADE;
  DROP TABLE "_sessions_v" CASCADE;
  DROP TABLE "sessions" CASCADE;
  DROP TABLE "workshops" CASCADE;
  DROP TYPE "public"."enum_workshops_tone";
  DROP TYPE "public"."enum_workshops_status";
  DROP TYPE "public"."enum__workshops_v_version_tone";
  DROP TYPE "public"."enum__workshops_v_version_status";
  DROP TYPE "public"."enum_sessions_state";
  DROP TYPE "public"."enum_sessions_status";
  DROP TYPE "public"."enum__sessions_v_version_state";
  DROP TYPE "public"."enum__sessions_v_version_status";`)
}
