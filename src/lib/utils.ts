import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from 'crypto'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate random string untuk token/password
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Generate token untuk pegawai
// Format: 6 karakter kombinasi angka dan huruf capital (contoh: A1B2C3)
export function generatePegawaiToken(role: 'guru' | 'tu'): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let token = ''
  for (let i = 0; i < 6; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

// Generate password plain untuk pegawai
export function generatePegawaiPassword(): string {
  return generateRandomString(30)
}

// Hash token untuk security (sama dengan siswa)
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}
