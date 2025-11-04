CREATE TABLE "admin" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar NOT NULL,
	"password" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "kandidat" (
	"id" serial PRIMARY KEY NOT NULL,
	"nomor_urut" integer NOT NULL,
	"nama_calon" varchar NOT NULL,
	"visi" text,
	"misi" text,
	"foto_url" varchar,
	"jumlah_suara" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "kandidat_nomor_urut_unique" UNIQUE("nomor_urut")
);
--> statement-breakpoint
CREATE TABLE "pengaturan" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama_pengaturan" varchar NOT NULL,
	"nilai" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pengaturan_nama_pengaturan_unique" UNIQUE("nama_pengaturan")
);
--> statement-breakpoint
CREATE TABLE "siswa" (
	"id" serial PRIMARY KEY NOT NULL,
	"nis" varchar NOT NULL,
	"nama_lengkap" varchar NOT NULL,
	"kelas" varchar NOT NULL,
	"token" varchar NOT NULL,
	"sudah_memilih" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "siswa_nis_unique" UNIQUE("nis")
);
