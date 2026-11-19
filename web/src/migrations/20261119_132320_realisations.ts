import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_realisations_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__realisations_v_version_status" AS ENUM('draft', 'published');

  CREATE TABLE "realisations" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar,
    "description" varchar,
    "display_order" numeric DEFAULT 100,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_realisations_status" DEFAULT 'draft'
  );

  CREATE TABLE "realisations_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "media_id" integer
  );

  CREATE TABLE "_realisations_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_title" varchar,
    "version_description" varchar,
    "version_display_order" numeric DEFAULT 100,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__realisations_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "_realisations_v_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "media_id" integer
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "realisations_id" integer;
  ALTER TABLE "realisations_rels" ADD CONSTRAINT "realisations_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."realisations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "realisations_rels" ADD CONSTRAINT "realisations_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_realisations_v" ADD CONSTRAINT "_realisations_v_parent_id_realisations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."realisations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_realisations_v_rels" ADD CONSTRAINT "_realisations_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_realisations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_realisations_v_rels" ADD CONSTRAINT "_realisations_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "realisations_updated_at_idx" ON "realisations" USING btree ("updated_at");
  CREATE INDEX "realisations_created_at_idx" ON "realisations" USING btree ("created_at");
  CREATE INDEX "realisations__status_idx" ON "realisations" USING btree ("_status");
  CREATE INDEX "realisations_rels_order_idx" ON "realisations_rels" USING btree ("order");
  CREATE INDEX "realisations_rels_parent_idx" ON "realisations_rels" USING btree ("parent_id");
  CREATE INDEX "realisations_rels_path_idx" ON "realisations_rels" USING btree ("path");
  CREATE INDEX "realisations_rels_media_id_idx" ON "realisations_rels" USING btree ("media_id");
  CREATE INDEX "_realisations_v_parent_idx" ON "_realisations_v" USING btree ("parent_id");
  CREATE INDEX "_realisations_v_version_version_updated_at_idx" ON "_realisations_v" USING btree ("version_updated_at");
  CREATE INDEX "_realisations_v_version_version_created_at_idx" ON "_realisations_v" USING btree ("version_created_at");
  CREATE INDEX "_realisations_v_version_version__status_idx" ON "_realisations_v" USING btree ("version__status");
  CREATE INDEX "_realisations_v_created_at_idx" ON "_realisations_v" USING btree ("created_at");
  CREATE INDEX "_realisations_v_updated_at_idx" ON "_realisations_v" USING btree ("updated_at");
  CREATE INDEX "_realisations_v_latest_idx" ON "_realisations_v" USING btree ("latest");
  CREATE INDEX "_realisations_v_rels_order_idx" ON "_realisations_v_rels" USING btree ("order");
  CREATE INDEX "_realisations_v_rels_parent_idx" ON "_realisations_v_rels" USING btree ("parent_id");
  CREATE INDEX "_realisations_v_rels_path_idx" ON "_realisations_v_rels" USING btree ("path");
  CREATE INDEX "_realisations_v_rels_media_id_idx" ON "_realisations_v_rels" USING btree ("media_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_realisations_fk" FOREIGN KEY ("realisations_id") REFERENCES "public"."realisations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_realisations_id_idx" ON "payload_locked_documents_rels" USING btree ("realisations_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "realisations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "realisations_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_realisations_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_realisations_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "realisations" CASCADE;
  DROP TABLE "realisations_rels" CASCADE;
  DROP TABLE "_realisations_v" CASCADE;
  DROP TABLE "_realisations_v_rels" CASCADE;

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_realisations_fk";

  DROP INDEX "payload_locked_documents_rels_realisations_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "realisations_id";
  DROP TYPE "public"."enum_realisations_status";
  DROP TYPE "public"."enum__realisations_v_version_status";`)
}
