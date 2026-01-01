ALTER TABLE "sprints" ADD COLUMN "start_date" timestamp;--> statement-breakpoint
ALTER TABLE "sprints" ADD COLUMN "end_date" timestamp;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "start_date" timestamp;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "end_date" timestamp;