CREATE TYPE "public"."group_member_role" AS ENUM('member', 'admin', 'evaluator');--> statement-breakpoint
CREATE TYPE "public"."organization_member_role" AS ENUM('member', 'admin');--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"metadata" text DEFAULT '{}' NOT NULL,
	"created_at" date DEFAULT now() NOT NULL,
	"updated_at" date DEFAULT now() NOT NULL,
	"deleted_at" date,
	"created_by" text NOT NULL,
	"updated_by" text,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "organization_group_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" serial NOT NULL,
	"organization_id" serial NOT NULL,
	"user_id" text NOT NULL,
	"role" "group_member_role" NOT NULL,
	"created_at" date DEFAULT now() NOT NULL,
	"updated_at" date DEFAULT now() NOT NULL,
	"deleted_at" date,
	"created_by" text NOT NULL,
	"updated_by" text,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "organization_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" serial NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"profile_picture" text,
	"created_at" date DEFAULT now() NOT NULL,
	"updated_at" date DEFAULT now() NOT NULL,
	"deleted_at" date,
	"created_by" text NOT NULL,
	"updated_by" text,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" serial NOT NULL,
	"user_id" text NOT NULL,
	"role" "organization_member_role" NOT NULL,
	"created_at" date DEFAULT now() NOT NULL,
	"updated_at" date DEFAULT now() NOT NULL,
	"deleted_at" date,
	"created_by" text NOT NULL,
	"updated_by" text,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"profile_picture" text,
	"type" text NOT NULL,
	"created_at" date DEFAULT now() NOT NULL,
	"updated_at" date DEFAULT now() NOT NULL,
	"deleted_at" date,
	"created_by" text NOT NULL,
	"updated_by" text,
	"deleted_by" text
);
--> statement-breakpoint
ALTER TABLE "hello" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "hello" CASCADE;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email_verified" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "verifications" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "verifications" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "verifications" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "verifications" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "impersonated_by" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ban_expires" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_group_members" ADD CONSTRAINT "organization_group_members_group_id_organization_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."organization_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_group_members" ADD CONSTRAINT "organization_group_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_groups" ADD CONSTRAINT "organization_groups_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_userId_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_userId_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");