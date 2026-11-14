CREATE INDEX "links_owner_created_idx" ON "links" USING btree ("owner_id","created_at");--> statement-breakpoint
CREATE INDEX "links_scheduled_due_idx" ON "links" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "links_health_due_idx" ON "links" USING btree ("health_enabled","health_next_check_at");