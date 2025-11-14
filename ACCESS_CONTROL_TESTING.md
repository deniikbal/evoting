# Access Control Testing Guide

## Overview
Dashboard sekarang menampilkan data (voting results) berdasarkan kombinasi:
1. **Admin Role** (SuperAdmin vs Admin)
2. **Voting Status** (votingAktif true/false)

## Access Control Rules

### SuperAdmin
- **votingAktif = true** (Voting Berlangsung)
  - ✅ **CAN SEE** voting results pada dashboard
  - ✅ Real-time data updates
  - Status: `Hasil Terlihat`

- **votingAktif = false** (Voting Selesai)
  - ✅ **CAN SEE** voting results pada dashboard
  - ✅ Final results visible
  - Status: `Hasil Terlihat`

### Admin
- **votingAktif = true** (Voting Berlangsung)
  - ❌ **CANNOT SEE** voting results pada dashboard
  - 🔒 Shows: "Voting sedang berlangsung..."
  - Status: `Hasil Tersembunyi`

- **votingAktif = false** (Voting Selesai)
  - ✅ **CAN SEE** voting results pada dashboard
  - ✅ Results visible
  - Status: `Hasil Terlihat`

## Testing Checklist

### Test 1: SuperAdmin + Voting Active

**Setup:**
```
1. Login sebagai SuperAdmin (role: 'superadmin')
2. Go to /admin/pengaturan
3. Enable voting (set votingAktif = true)
4. Open /admin/dashboard
```

**Expected Results:**
```
Access Control Info Box:
├─ Badge: SuperAdmin (merah)
├─ Status: Voting Berlangsung (oranye)
├─ Visibility: Hasil Terlihat ✅ (hijau, checkmark)
└─ Message: SuperAdmin dapat melihat hasil kapan saja

Statistik Cards:
├─ Total Pemilih: [number]
├─ Sudah Memilih: [number]
└─ Belum Memilih: [number]

Quick Results Section:
├─ Mitra Tama (Kelas XI): [candidates list with votes]
├─ Mitra Muda (Kelas X): [candidates list with votes]
└─ Real-time updates setiap 5 detik
```

**Verification:**
- [ ] Access Control Info visible at top
- [ ] SuperAdmin badge shown
- [ ] "Voting Berlangsung" status shown
- [ ] "Hasil Terlihat" with green checkmark
- [ ] Results section VISIBLE (not hidden)
- [ ] Vote counts shown for all candidates
- [ ] Results update when you add votes
- [ ] Updates happen every 5 seconds

---

### Test 2: SuperAdmin + Voting Inactive

**Setup:**
```
1. Login sebagai SuperAdmin
2. Go to /admin/pengaturan
3. Disable voting (set votingAktif = false)
4. Open /admin/dashboard
```

**Expected Results:**
```
Access Control Info Box:
├─ Badge: SuperAdmin (merah)
├─ Status: Voting Selesai (hijau)
├─ Visibility: Hasil Terlihat ✅ (hijau, checkmark)
└─ Message: SuperAdmin dapat melihat hasil kapan saja

Quick Results Section:
├─ Mitra Tama results: VISIBLE ✅
├─ Mitra Muda results: VISIBLE ✅
└─ Vote counts shown for all candidates
```

**Verification:**
- [ ] Access Control Info visible
- [ ] SuperAdmin badge shown
- [ ] "Voting Selesai" status shown (green)
- [ ] "Hasil Terlihat" with green checkmark
- [ ] Results section VISIBLE
- [ ] All candidates and votes shown

---

### Test 3: Admin + Voting Active

**Setup:**
```
1. Login sebagai Admin (role: 'admin')
2. Go to /admin/pengaturan
3. Enable voting (set votingAktif = true)
4. Open /admin/dashboard
```

**Expected Results:**
```
Access Control Info Box:
├─ Badge: Admin (biru)
├─ Status: Voting Berlangsung (oranye)
├─ Visibility: Hasil Tersembunyi 🔒 (oranye, lock icon)
└─ Message: Admin hanya bisa melihat hasil ketika voting selesai

Quick Results Section:
├─ Title: Hasil Akhir Perolehan Akhir Pemilihan Ketua OSIS
├─ Message: "Hasil akan ditampilkan setelah voting selesai"
├─ Lock Icon
└─ "Voting sedang berlangsung. Nonaktifkan voting untuk melihat hasil."
```

**Verification:**
- [ ] Access Control Info visible
- [ ] Admin badge shown (blue)
- [ ] "Voting Berlangsung" status shown
- [ ] "Hasil Tersembunyi" with orange lock icon
- [ ] Results section NOT visible (shows lock message instead)
- [ ] Candidates list is empty/hidden
- [ ] Vote counts not shown

---

### Test 4: Admin + Voting Inactive

**Setup:**
```
1. Login sebagai Admin (role: 'admin')
2. Go to /admin/pengaturan
3. Disable voting (set votingAktif = false)
4. Open /admin/dashboard
```

**Expected Results:**
```
Access Control Info Box:
├─ Badge: Admin (biru)
├─ Status: Voting Selesai (hijau)
├─ Visibility: Hasil Terlihat ✅ (hijau, checkmark)
└─ Message: Admin bisa melihat hasil karena voting sudah selesai

Quick Results Section:
├─ Mitra Tama results: VISIBLE ✅
├─ Mitra Muda results: VISIBLE ✅
└─ Vote counts shown for all candidates
```

**Verification:**
- [ ] Access Control Info visible
- [ ] Admin badge shown (blue)
- [ ] "Voting Selesai" status shown (green)
- [ ] "Hasil Terlihat" with green checkmark
- [ ] Results section VISIBLE
- [ ] All candidates and votes shown

---

## Quick Test Matrix

| Role | Voting Status | Expected | Result | Status |
|------|---------------|----------|--------|--------|
| SuperAdmin | Active ✓ | Show results | ✅ | Test 1 |
| SuperAdmin | Inactive | Show results | ✅ | Test 2 |
| Admin | Active ✓ | Hide results | 🔒 | Test 3 |
| Admin | Inactive | Show results | ✅ | Test 4 |

## Testing Workflow

### Full End-to-End Test:

```
Step 1: Test as SuperAdmin
├─ Login as superadmin
├─ Enable voting
├─ Check dashboard → Results visible ✅
├─ Disable voting
└─ Check dashboard → Results still visible ✅

Step 2: Test as Admin
├─ Logout
├─ Login as admin
├─ Enable voting
├─ Check dashboard → Results hidden ✅
├─ Disable voting
└─ Check dashboard → Results visible ✅

Step 3: Real-time Updates
├─ Login as superadmin
├─ Enable voting
├─ Open dashboard in 2 windows
├─ Add some votes in /voting page
├─ Watch results update every 5 seconds in both windows
└─ Verify live vote counts ✅
```

## Troubleshooting

### Problem: SuperAdmin doesn't see results during active voting

**Debug:**
1. Check `/admin/debug` → Is role 'superadmin'?
   - If NO → Update role to superadmin
   - If YES → Continue

2. Check browser console:
   - Open DevTools (F12)
   - Check for errors
   - Look for fetch calls to `/api/admin/statistik`

3. Check Access Control Info box:
   - Should show "SuperAdmin" badge
   - Should show "Hasil Terlihat" (green)

4. Refresh page (Ctrl+F5)

### Problem: Admin sees results when voting is active

**Debug:**
1. Verify you're logged in as "Admin" not "SuperAdmin"
   - Check `/admin/debug` → What's the role?
   - Should be 'admin', not 'superadmin'

2. Check Access Control Info box:
   - Should show "Admin" badge (blue)
   - Should show "Hasil Tersembunyi" (orange)

3. Check voting status:
   - Go to `/admin/pengaturan`
   - Is voting enabled (votingAktif = true)?

### Problem: Results not updating in real-time

**Debug:**
1. Check network tab (DevTools → Network)
   - Should see requests to `/api/admin/statistik` every 5 seconds
   - Should see requests to `/api/kandidat` every 5 seconds

2. Check if you're adding votes:
   - Add a vote from voting page
   - Wait up to 5 seconds
   - Check dashboard for updated counts

3. Try manual refresh (F5)

## Component Details

### AccessControlInfo Component
Location: `src/components/admin/AccessControlInfo.tsx`

Displays:
- Current admin role
- Current voting status
- Data visibility status
- Explanation message

Updates when:
- Admin role changes (on login)
- Voting status changes (every 5 seconds)
- Component re-renders

### Dashboard Integration
Location: `src/app/admin/dashboard/page.tsx`

Logic:
```typescript
const shouldShowResults = !data.votingAktif || adminRole === 'superadmin'

if (shouldShowResults) {
  fetchKandidat()  // Show results
} else {
  setKandidat([]) // Hide results
}
```

Updates:
- Every 5 seconds via interval
- Immediately on role/voting status change

## Compliance Checklist

- [x] SuperAdmin can ALWAYS see results
- [x] Admin ONLY sees results when votingAktif = false
- [x] Clear visual indicators of access level
- [x] Real-time data updates (5 second interval)
- [x] Status information always visible
- [x] Responsive design (desktop & mobile)
- [x] Error handling
- [x] Console logging for debugging

## Notes

- This implementation uses client-side state management with real-time updates
- Data refreshes every 5 seconds automatically
- No page refresh required to see updates
- Access control is enforced at dashboard level
- Admin page (/admin/hasil) has additional server-side restrictions
