CREATE TABLE "pegawai" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" varchar NOT NULL,
	"email" varchar NOT NULL,
	"password_plain" varchar NOT NULL,
	"token" varchar NOT NULL,
	"role" varchar(50) NOT NULL,
	"nip" varchar,
	"nomor_induk" varchar,
	"status" varchar(50) DEFAULT 'aktif' NOT NULL,
	"sudah_memilih" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pegawai_email_unique" UNIQUE("email"),
	CONSTRAINT "pegawai_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "vote" ALTER COLUMN "siswa_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "vote" ADD COLUMN "pegawai_id" integer;--> statement-breakpoint
ALTER TABLE "vote" ADD COLUMN "voter_type" varchar(50) DEFAULT 'siswa' NOT NULL;