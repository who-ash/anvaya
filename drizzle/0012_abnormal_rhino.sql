ALTER TABLE "meeting_recordings" ADD COLUMN "messages_url" text;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "organization_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "project_id" integer;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;