import { pgTable, serial, varchar, boolean, integer, timestamp, text } from 'drizzle-orm/pg-core'

export const classroom = pgTable('classroom', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  angkatan: varchar('angkatan', { length: 20 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
})

export const siswa = pgTable('siswa', {
  id: serial('id').primaryKey(),
  nis: varchar('nis').notNull().unique(),
  namaLengkap: varchar('nama_lengkap').notNull(),
  kelas: varchar('kelas').notNull(),
  classroomId: integer('classroom_id'),
  token: varchar('token').notNull(),
  plainToken: varchar('plain_token').notNull(),
  sudahMemilih: boolean('sudah_memilih').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
})

export const kandidat = pgTable('kandidat', {
  id: serial('id').primaryKey(),
  nomorUrut: integer('nomor_urut').notNull().unique(),
  namaCalon: varchar('nama_calon').notNull(),
  visi: text('visi'),
  misi: text('misi'),
  fotoUrl: varchar('foto_url'),
  jumlahSuara: integer('jumlah_suara').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
})

export const pengaturan = pgTable('pengaturan', {
  id: serial('id').primaryKey(),
  namaPengaturan: varchar('nama_pengaturan').notNull().unique(),
  nilai: varchar('nilai').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
})

export const admin = pgTable('admin', {
  id: serial('id').primaryKey(),
  username: varchar('username').notNull().unique(),
  password: varchar('password').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
})
