ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "reply_to_id" uuid;
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "score" integer DEFAULT 0;
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "reply_count" integer DEFAULT 0;

CREATE TABLE IF NOT EXISTS "comment_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"reported_by" text,
	"reason" text,
	"created_at" timestamp DEFAULT now()
);

ALTER TABLE "comment_flags" ADD CONSTRAINT "comment_flags_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "comment_flags" ADD CONSTRAINT "comment_flags_reported_by_user_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "idx_comments_reply_to" ON "comments" USING btree ("reply_to_id");
CREATE INDEX IF NOT EXISTS "idx_comment_flags_comment" ON "comment_flags" USING btree ("comment_id");
