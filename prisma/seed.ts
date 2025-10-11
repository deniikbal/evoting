import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('Start seeding...')

  // Create default admin
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const existingAdmin = await db.admin.findFirst({
    where: { username: 'admin' }
  })

  if (!existingAdmin) {
    await db.admin.create({
      data: {
        username: 'admin',
        password: hashedPassword
      }
    })
    console.log('✓ Default admin created (username: admin, password: admin123)')
  }

  // Create default settings
  const settings = [
    { namaPengaturan: 'voting_aktif', nilai: 'false' },
    { namaPengaturan: 'waktu_mulai_voting', nilai: '' },
    { namaPengaturan: 'waktu_selesai_voting', nilai: '' }
  ]

  for (const setting of settings) {
    const existingSetting = await db.pengaturan.findUnique({
      where: { namaPengaturan: setting.namaPengaturan }
    })

    if (!existingSetting) {
      await db.pengaturan.create({
        data: setting
      })
      console.log(`✓ Setting ${setting.namaPengaturan} created`)
    }
  }

  // Create sample candidates
  const existingCandidates = await db.kandidat.count()
  if (existingCandidates === 0) {
    const candidates = [
      {
        nomorUrut: 1,
        namaCalon: 'Ahmad Rizki',
        visi: 'Mewujudkan OSIS yang inovatif dan responsif terhadap kebutuhan siswa.',
        misi: '1. Mengembangkan program kerja yang kreatif\n2. Meningkatkan komunikasi antar siswa\n3. Memperkuat solidaritas dan kebersamaan'
      },
      {
        nomorUrut: 2,
        namaCalon: 'Siti Nurhaliza',
        visi: 'Membangun OSIS yang berintegritas dan berorientasi pada prestasi.',
        misi: '1. Meningkatkan prestasi akademik dan non-akademik\n2. Mengadakan kegiatan yang bermanfaat\n3. Menjaga nama baik sekolah'
      },
      {
        nomorUrut: 3,
        namaCalon: 'Budi Santoso',
        visi: 'OSIS sebagai wadah pengembangan potensi siswa yang holistik.',
        misi: '1. Mengoptimalkan ekstrakurikuler\n2. Memfasilitasi minat dan bakat siswa\n3. Menciptakan lingkungan sekolah yang kondusif'
      }
    ]

    for (const candidate of candidates) {
      await db.kandidat.create({
        data: candidate
      })
    }
    console.log('✓ Sample candidates created')
  }

  // Create sample students
  const existingStudents = await db.siswa.count()
  if (existingStudents === 0) {
    const students = []
    const classes = ['XII IPA 1', 'XII IPA 2', 'XII IPS 1', 'XII IPS 2', 'XI IPA 1', 'XI IPA 2']
    
    for (let i = 1; i <= 20; i++) {
      const kelas = classes[Math.floor(Math.random() * classes.length)]
      const token = Math.random().toString(36).substring(2, 8)
      const hashedToken = await bcrypt.hash(token, 10)
      
      students.push({
        nis: `2024${String(i).padStart(3, '0')}`,
        namaLengkap: `Siswa ${i}`,
        kelas: kelas,
        token: hashedToken
      })
    }

    for (const student of students) {
      await db.siswa.create({
        data: student
      })
    }
    console.log('✓ Sample students created')
  }

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await db.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })