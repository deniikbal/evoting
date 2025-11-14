ALTER TABLE "kandidat" DROP CONSTRAINT "kandidat_nomor_urut_unique";
ALTER TABLE "kandidat" ADD CONSTRAINT "kandidat_nomor_urut_role_unique" UNIQUE("nomor_urut", "role");