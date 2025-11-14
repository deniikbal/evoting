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
  nomorUrut: integer('nomor_urut').notNull(),
  namaCalon: varchar('nama_calon').notNull(),
  visi: text('visi'),
  misi: text('misi'),
  fotoUrl: varchar('foto_url'),
  jumlahSuara: integer('jumlah_suara').notNull().default(0),
  role: varchar('role', { length: 50 }).notNull().default('mitramuda'),
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

export const pegawai = pgTable('pegawai', {
  id: serial('id').primaryKey(),
  nama: varchar('nama').notNull(),
  email: varchar('email').notNull().unique(),
  token: varchar('token').notNull().unique(),
  tokenPlain: varchar('token_plain', { length: 10 }).notNull(), // 6-char plain token untuk display
  role: varchar('role', { length: 50 }).notNull(), // 'guru' atau 'tu'
  nip: varchar('nip'),
  nomorInduk: varchar('nomor_induk'),
  kelas: varchar('kelas'), // 'X-1', 'X-2', 'XI-1', etc. (optional)
  classroomId: integer('classroom_id'), // link ke classroom table (optional)
  status: varchar('status', { length: 50 }).notNull().default('aktif'), // 'aktif' atau 'non-aktif'
  sudahMemilih: boolean('sudah_memilih').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
})

export const vote = pgTable('vote', {
  id: serial('id').primaryKey(),
  siswaId: integer('siswa_id'),
  pegawaiId: integer('pegawai_id'),
  kandidatId: integer('kandidat_id').notNull(),
  voterType: varchar('voter_type', { length: 50 }).notNull(), // 'siswa', 'guru', 'tu'
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
})
