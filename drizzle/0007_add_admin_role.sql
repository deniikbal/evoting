ALTER TABLE "admin" ADD COLUMN "role" varchar(50) NOT NULL DEFAULT 'admin';
ALTER TABLE "admin" ADD COLUMN "updated_at" timestamp NOT NULL DEFAULT now();
