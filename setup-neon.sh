#!/bin/bash

echo "🚀 Setup Neon Database Connection untuk E-Voting OSIS"
echo "=================================================="

echo ""
echo "📋 Langkah-langkah untuk mendapatkan connection string Neon:"
echo ""
echo "1. Login ke dashboard Neon: https://neon.tech"
echo "2. Buat project baru atau pilih project yang ada"
echo "3. Klik pada project Anda"
echo "4. Klik 'Connection details' atau 'Connection string'"
echo "5. Copy connection string yang ada"
echo ""
echo "Format connection string biasanya seperti ini:"
echo "postgresql://username:password@host:port/database?sslmode=require"
echo ""

read -p "Masukkan Neon connection string Anda: " neon_url

if [ -z "$neon_url" ]; then
    echo "❌ Connection string tidak boleh kosong!"
    exit 1
fi

# Update .env file
sed -i "s|DATABASE_URL=\".*\"|DATABASE_URL=\"$neon_url\"|" .env

echo ""
echo "✅ Connection string berhasil disimpan ke .env"
echo ""

# Push schema to Neon
echo "🔄 Push schema database ke Neon..."
npm run db:push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Schema berhasil di-push ke Neon!"
    echo ""
    echo "🌱 Menjalankan seed data..."
    npm run db:seed
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 Setup database Neon selesai!"
        echo ""
        echo "📊 Data yang telah dibuat:"
        echo "   - Admin: username 'admin', password 'admin123'"
        echo "   - 3 kandidat sample"
        echo "   - 20 siswa sample dengan token"
        echo ""
        echo "🚀 Aplikasi siap digunakan dengan database Neon!"
    else
        echo ""
        echo "⚠️  Schema berhasil tapi seed gagal. Jalankan manual: npm run db:seed"
    fi
else
    echo ""
    echo "❌ Gagal push schema ke Neon. Periksa connection string Anda!"
    echo ""
    echo "💡 Tips:"
    echo "   - Pastikan connection string benar"
    echo "   - Pastikan database Neon sudah aktif"
    echo "   - Periksa koneksi internet"
fi