CREATE TABLE "classroom" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"angkatan" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vote" (
	"id" serial PRIMARY KEY NOT NULL,
	"siswa_id" integer NOT NULL,
	"kandidat_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "siswa" ADD COLUMN "classroom_id" integer;--> statement-breakpoint
ALTER TABLE "siswa" ADD COLUMN "plain_token" varchar NOT NULL;