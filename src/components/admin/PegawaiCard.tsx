interface Pegawai {
  nama: string
  email: string
  role: 'guru' | 'tu'
  plainToken: string
}

interface PegawaiCardProps {
  pegawai: Pegawai
}

export default function PegawaiCard({ pegawai }: PegawaiCardProps) {
  const roleLabel = pegawai.role === 'guru' ? 'GURU' : 'TENAGA KEPENDIDIKAN'
  
  return (
    <div className="voter-card bg-white border border-gray-800 rounded p-1.5">
      <div className="text-center mb-1 pb-0.5 border-b border-gray-800">
        <h2 className="text-[9px] font-bold text-gray-900 leading-tight">PEMILIHAN KETUA OSIS</h2>
      </div>
      
      <div className="space-y-0.5">
        <div className="flex text-[7px] leading-tight">
          <span className="w-16 font-semibold text-gray-700">JABATAN</span>
          <span className="flex-1">: {roleLabel}</span>
        </div>
        
        <div className="flex text-[7px] leading-tight">
          <span className="w-16 font-semibold text-gray-700">NAMA</span>
          <span className="flex-1 truncate">: {pegawai.nama}</span>
        </div>
        
        <div className="flex text-[7px] leading-tight">
          <span className="w-16 font-semibold text-gray-700">EMAIL</span>
          <span className="flex-1 truncate text-[6.5px]">: {pegawai.email}</span>
        </div>
        
        <div className="flex items-center mt-1 pt-0.5 border-t border-gray-300 text-[7px]">
          <span className="w-16 font-semibold text-gray-700">TOKEN</span>
          <span className="flex-1">: <span className="text-[11px] font-bold tracking-wide">{pegawai.plainToken}</span></span>
        </div>
      </div>
      
      <div className="mt-0.5 pt-0.5 border-t border-gray-300 text-[5px] text-gray-500 text-center leading-tight">
        Simpan kartu ini dengan baik
      </div>
    </div>
  )
}
