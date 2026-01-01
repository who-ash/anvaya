CREATE TABLE "project_calendar_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"reminder_intervals" text[],
	"sync_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "project_calendar_settings_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
ALTER TABLE "project_calendar_settings" ADD CONSTRAINT "project_calendar_settings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;