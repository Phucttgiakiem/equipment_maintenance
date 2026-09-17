CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
INSERT INTO "categories" ("name")
SELECT DISTINCT "category" FROM "equipment"
WHERE "category" IS NOT NULL AND btrim("category") <> '';
--> statement-breakpoint
ALTER TABLE "equipment" ADD COLUMN "category_id" uuid;
--> statement-breakpoint
UPDATE "equipment" AS e SET "category_id" = c."id"
FROM "categories" AS c
WHERE e."category" = c."name";
--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment" DROP COLUMN "category";
