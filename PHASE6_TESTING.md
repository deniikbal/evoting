# Phase 6: Unified Login & Voting Flow Testing

## Testing Objectives
This document outlines comprehensive testing procedures for the unified login and voting system that supports:
- **Siswa (Students)**: NIS + Token authentication
- **Pegawai (Guru/TU)**: Email + Password authentication

---

## Pre-Testing Setup

### 1. Database Verification
Ensure database has test data:
```sql
-- Check siswa count
SELECT COUNT(*) as total_siswa, SUM(CASE WHEN sudah_memilih = true THEN 1 ELSE 0 END) as sudah_memilih FROM siswa;

-- Check pegawai count
SELECT COUNT(*) as total_pegawai, role, SUM(CASE WHEN sudah_memilih = true THEN 1 ELSE 0 END) as sudah_memilih FROM pegawai GROUP BY role;

-- Check voting status
SELECT nama_pengaturan, nilai FROM pengaturan WHERE nama_pengaturan = 'voting_aktif';
```

### 2. Enable Voting
Admin must enable voting before testing:
- Navigate to `/admin/dashboard`
- Ensure voting is "AKTIF"

---

## Test Cases

### Phase 6.1: Siswa Login Test

#### 6.1.1 Successful Siswa Login
**Scenario**: Siswa logs in with valid NIS + Token
- **Steps**:
  1. Navigate to `/login`
  2. Select "Siswa" tab
  3. Enter valid NIS (e.g., "001")
  4. Enter valid Token (6-char, e.g., "A1B2C3")
  5. Click "Login"

- **Expected Results**:
  - ✅ Login successful message or redirect to `/voting`
  - ✅ `siswaSession` stored in localStorage
  - ✅ Session contains: id, nis, namaLengkap, kelas, sudahMemilih

#### 6.1.2 Siswa Login - Invalid Token
**Scenario**: Siswa enters wrong token
- **Steps**:
  1. Navigate to `/login`
  2. Enter valid NIS
  3. Enter invalid token
  4. Click "Login"

- **Expected Results**:
  - ❌ Error message: "Username, token/password salah atau tidak ditemukan"
  - ❌ No redirect, stay on login page
  - ❌ localStorage empty

#### 6.1.3 Siswa Login - Invalid NIS
**Scenario**: Siswa enters non-existent NIS
- **Steps**:
  1. Navigate to `/login`
  2. Enter non-existent NIS
  3. Enter any token
  4. Click "Login"

- **Expected Results**:
  - ❌ Error message displayed
  - ❌ No redirect to voting page

#### 6.1.4 Siswa Already Voted
**Scenario**: Siswa who already voted tries to access voting page
- **Pre-condition**: Manually set siswa.sudah_memilih = true in database
- **Steps**:
  1. Navigate to `/login`
  2. Login with this siswa's credentials
  3. Should redirect to `/terima-kasih`

- **Expected Results**:
  - ✅ Redirect to thank you page (sudah_memilih = true)
  - ✅ Message: "Anda telah berhasil menggunakan hak suara Anda"

---

### Phase 6.2: Pegawai Login Test

#### 6.2.1 Successful Pegawai (Guru) Login
**Scenario**: Guru logs in with valid email + password
- **Steps**:
  1. Navigate to `/login`
  2. Select "Guru & TU" tab
  3. Enter valid email (e.g., "guru@sekolah.com")
  4. Enter valid password
  5. Click "Login"

- **Expected Results**:
  - ✅ Login successful, redirect to `/voting`
  - ✅ `pegawaiSession` stored in localStorage
  - ✅ Session contains: id, nama, email, role='guru', sudahMemilih

#### 6.2.2 Successful Pegawai (TU) Login
**Scenario**: TU staff logs in with valid email + password
- **Steps**:
  1. Navigate to `/login`
  2. Select "Guru & TU" tab
  3. Enter TU email
  4. Enter TU password
  5. Click "Login"

- **Expected Results**:
  - ✅ Login successful, redirect to `/voting`
  - ✅ `pegawaiSession` with role='tu'

#### 6.2.3 Pegawai Login - Wrong Password
**Scenario**: Pegawai enters wrong password
- **Steps**:
  1. Navigate to `/login`
  2. Select "Guru & TU" tab
  3. Enter valid email
  4. Enter wrong password
  5. Click "Login"

- **Expected Results**:
  - ❌ Error message displayed
  - ❌ No redirect

#### 6.2.4 Pegawai Login - Invalid Email
**Scenario**: Pegawai enters non-existent email
- **Steps**:
  1. Navigate to `/login`
  2. Select "Guru & TU" tab
  3. Enter invalid email
  4. Enter any password
  5. Click "Login"

- **Expected Results**:
  - ❌ Error message: credentials not found
  - ❌ No redirect

#### 6.2.5 Pegawai Login - Non-Aktif Account
**Scenario**: Pegawai with status='non-aktif' tries to login
- **Pre-condition**: Set pegawai.status = 'non-aktif' in database
- **Steps**:
  1. Navigate to `/login`
  2. Select "Guru & TU" tab
  3. Enter email + password for non-aktif pegawai
  4. Click "Login"

- **Expected Results**:
  - ❌ Error message: "Akun tidak aktif"

#### 6.2.6 Pegawai Already Voted
**Scenario**: Pegawai who already voted tries to access voting page
- **Pre-condition**: Set pegawai.sudah_memilih = true in database
- **Steps**:
  1. Login with pegawai credentials
  2. Should redirect to `/terima-kasih`

- **Expected Results**:
  - ✅ Redirect to thank you page
  - ✅ Display message for already-voted status

---

### Phase 6.3: Siswa Voting Flow

#### 6.3.1 Siswa Selects & Votes
**Scenario**: Fresh siswa successfully votes for both categories
- **Pre-condition**: Siswa logged in, sudah_memilih = false
- **Steps**:
  1. See Mitra Tama candidates (Kelas XI)
  2. Click on one Mitra Tama candidate
  3. Verify ring selection and "Dipilih" status shows
  4. See Mitra Muda candidates (Kelas X)
  5. Click on one Mitra Muda candidate
  6. Verify selection shows
  7. Bottom action bar appears with selections
  8. Click "Konfirmasi Pilihan"
  9. Confirmation dialog appears
  10. Click "Ya, Konfirmasi"

- **Expected Results**:
  - ✅ Both votes submitted via API
  - ✅ Response: votes recorded in database
  - ✅ Redirect to `/terima-kasih`
  - ✅ Siswa.sudah_memilih set to true
  - ✅ Vote table updated with:
    - siswaId
    - voterType = 'siswa'
    - kandidatId (for both votes)
  - ✅ Kandidat.jumlahSuara incremented

#### 6.3.2 Siswa Cannot Vote Twice
**Scenario**: Siswa tries to vote after already voting
- **Pre-condition**: siswa.sudah_memilih = true
- **Steps**:
  1. Login with this siswa's credentials
  2. Should see thank you page, not voting page

- **Expected Results**:
  - ✅ Access denied to voting page
  - ✅ Redirect to `/terima-kasih` or login page

---

### Phase 6.4: Pegawai Voting Flow

#### 6.4.1 Pegawai (Guru) Votes Successfully
**Scenario**: Guru votes for both categories
- **Pre-condition**: Guru logged in, sudah_memilih = false
- **Steps**:
  1. See voting page with guru name displayed
  2. Select Mitra Tama candidate
  3. Select Mitra Muda candidate
  4. Click "Konfirmasi Pilihan"
  5. Confirm votes

- **Expected Results**:
  - ✅ Votes submitted with:
    - pegawaiId (guru's id)
    - voterType = 'guru'
  - ✅ Vote table updated
  - ✅ Redirect to thank you page
  - ✅ Pegawai.sudah_memilih = true

#### 6.4.2 Pegawai (TU) Votes Successfully
**Scenario**: TU staff votes for both categories
- **Pre-condition**: TU logged in, sudah_memilih = false
- **Steps**:
  1. Same voting flow as guru
  2. TU name should display

- **Expected Results**:
  - ✅ Votes recorded with:
    - pegawaiId (TU's id)
    - voterType = 'tu'
  - ✅ Successfully redirects to thank you page

#### 6.4.3 Pegawai Cannot Vote Twice
**Scenario**: Pegawai tries to vote after already voting
- **Pre-condition**: pegawai.sudah_memilih = true
- **Steps**:
  1. Login with pegawai who already voted
  2. Should redirect to thank you page

- **Expected Results**:
  - ✅ Access denied, redirected immediately

---

### Phase 6.5: Dashboard Statistics

#### 6.5.1 Dashboard Shows Combined Totals
**Scenario**: Admin views dashboard after mixed voting
- **Setup**:
  - 10 siswa: 7 voted
  - 5 guru: 3 voted
  - 3 TU: 2 voted

- **Expected Results**:
  - ✅ Dashboard shows:
    - Total Voters: 18
    - Sudah Memilih: 12
    - Belum Memilih: 6
  - ✅ Breakdown available:
    - Siswa: 10 total, 7 voted
    - Pegawai: 8 total, 5 voted

#### 6.5.2 Dashboard Auto-Updates
**Scenario**: Admin watches dashboard during live voting
- **Setup**:
  - Dashboard open
  - Siswa/Pegawai voting in another window

- **Expected Results**:
  - ✅ Dashboard refreshes every 5 seconds
  - ✅ Vote counts update automatically
  - ✅ Percentages update correctly

#### 6.5.3 Vote Type Tracking in Results
**Scenario**: Verify voting results show voterType correctly
- **Expected Results**:
  - ✅ Vote table contains voterType ('siswa', 'guru', 'tu')
  - ✅ Voting API returns voterType
  - ✅ Results can be filtered/grouped by voterType

---

### Phase 6.6: Edge Cases & Error Handling

#### 6.6.1 Voting Disabled
**Scenario**: User tries to vote when voting is disabled
- **Setup**: Set voting_aktif = 'false'
- **Steps**:
  1. Try login

- **Expected Results**:
  - ❌ Error message: "Voting belum dimulai atau sudah selesai"
  - ❌ Cannot proceed to voting page

#### 6.6.2 Network Error During Voting
**Scenario**: Network fails during vote submission
- **Steps**:
  1. Select both candidates
  2. Disconnect internet/simulate network error
  3. Click "Ya, Konfirmasi"

- **Expected Results**:
  - ❌ Error message displayed
  - ❌ Dialog stays open
  - ❌ Can retry or cancel
  - ❌ Database transaction rolled back

#### 6.6.3 Partial Vote Submission (both fail)
**Scenario**: Both vote submissions fail
- **Steps**:
  1. Simulate API returning 500 error
  2. User clicks "Ya, Konfirmasi"

- **Expected Results**:
  - ❌ Error shown
  - ❌ Votes NOT recorded
  - ❌ sudah_memilih remains false

#### 6.6.4 Mixed Device Types
**Scenario**: Test on mobile and desktop
- **Devices**: Phone (iOS/Android), Tablet, Desktop
- **Tests**:
  - Login form displays correctly
  - Voting page responsive
  - Action buttons accessible
  - Confirmation dialog readable

- **Expected Results**:
  - ✅ All features work on all devices
  - ✅ Touch-friendly buttons
  - ✅ No layout breaks

---

## Integration Test Scenarios

### Scenario A: Complete Voting Day (Mixed Users)
**Timeline**:
1. Morning: 5 siswa vote
2. Mid-day: 3 guru vote
3. Afternoon: 2 TU + 3 more siswa vote
4. Admin checks dashboard after each phase

**Expected Results**:
- ✅ All votes recorded correctly
- ✅ Dashboard updates accurately
- ✅ No data loss or duplication
- ✅ Vote counts match database
- ✅ Vote table shows correct voterType

### Scenario B: Load Testing
**Concurrent Voters**: 10 simultaneous votes (mix of siswa/pegawai)

**Expected Results**:
- ✅ All votes processed
- ✅ No race conditions
- ✅ Vote counts correct
- ✅ No duplicate votes
- ✅ Response times < 2 seconds

### Scenario C: Voting Disabled Mid-Session
**Flow**:
1. 3 siswa vote
2. Admin disables voting
3. More siswa/pegawai try to login

**Expected Results**:
- ✅ First 3 votes recorded
- ✅ New attempts blocked
- ✅ Clear error message for disabled voting
- ✅ Dashboard reflects final count

---

## Regression Tests

### Existing Functionality
- [ ] Siswa admin page: list, import, export works
- [ ] Pegawai admin page: CRUD operations work
- [ ] Kandidat admin page: add, edit, delete works
- [ ] Landing page displays correctly
- [ ] Admin dashboard loads
- [ ] Results page shows votes correctly

---

## Performance Tests

### Load Times
- [ ] Login page: < 1s
- [ ] Voting page: < 2s
- [ ] Dashboard: < 2s
- [ ] Vote submission: < 3s

### Database Queries
- [ ] Login query: < 100ms
- [ ] Vote submission: < 200ms
- [ ] Dashboard stats: < 150ms

---

## Security Tests

### Authentication
- [ ] Invalid tokens rejected
- [ ] Session hijacking prevented
- [ ] localStorage correctly cleared on logout
- [ ] Password hashing verified (pegawai)

### Authorization
- [ ] Pegawai can only vote once
- [ ] Siswa can only vote once
- [ ] Non-aktif pegawai cannot vote
- [ ] Completed votes cannot be modified

### Input Validation
- [ ] Email format validation (pegawai login)
- [ ] NIS format validation (siswa login)
- [ ] Token format validation (siswa login)
- [ ] Password requirements enforced

---

## Documentation Tests

### User Guides
- [ ] Login instructions clear
- [ ] Voting process documented
- [ ] Error messages helpful
- [ ] Thank you page message appropriate

---

## Test Execution Report Template

```
Date: ______
Tester: ______
Environment: [Development/Staging/Production]

Test Case                          Result    Notes
────────────────────────────────────────────────────
6.1.1 Siswa Login Successful      [ ]Pass   
6.1.2 Siswa Invalid Token         [ ]Pass   
6.1.3 Siswa Invalid NIS           [ ]Pass   
6.1.4 Siswa Already Voted         [ ]Pass   
6.2.1 Guru Login Successful       [ ]Pass   
6.2.2 TU Login Successful         [ ]Pass   
6.2.3 Pegawai Wrong Password      [ ]Pass   
6.2.4 Pegawai Invalid Email       [ ]Pass   
6.2.5 Pegawai Non-Aktif Account   [ ]Pass   
6.2.6 Pegawai Already Voted       [ ]Pass   
6.3.1 Siswa Votes Successfully    [ ]Pass   
6.3.2 Siswa Cannot Vote Twice     [ ]Pass   
6.4.1 Guru Votes Successfully     [ ]Pass   
6.4.2 TU Votes Successfully       [ ]Pass   
6.4.3 Pegawai Cannot Vote Twice   [ ]Pass   
6.5.1 Dashboard Shows Combined    [ ]Pass   
6.5.2 Dashboard Auto-Updates      [ ]Pass   
6.5.3 Vote Type Tracking          [ ]Pass   
6.6.1 Voting Disabled             [ ]Pass   
6.6.2 Network Error               [ ]Pass   
6.6.3 Partial Submission          [ ]Pass   
6.6.4 Mixed Devices               [ ]Pass   

Total: __/22 Passed
Issues Found: ____
```

---

## Known Limitations & Notes

1. **Token Format**: Siswa tokens are 6-character alphanumeric (A1B2C3)
2. **Voting Active**: Requires `voting_aktif = 'true'` in pengaturan table
3. **Dual Vote**: Both Mitra Tama and Mitra Muda must be selected
4. **One Vote Per Category**: Cannot vote for multiple candidates in same category
5. **No Vote Changes**: Once submitted, votes are final and cannot be changed

---

## Success Criteria for Phase 6

✅ All test cases pass
✅ No security vulnerabilities found
✅ Dashboard statistics accurate
✅ Vote tracking by voterType working
✅ Mixed siswa/pegawai voting flows functional
✅ Error handling appropriate
✅ Performance acceptable (< 3s for vote submission)
✅ No data loss in any scenario
✅ All user types (siswa, guru, tu) can vote

---

## Rollout Checklist

Before going live:
- [ ] All test cases passed
- [ ] Database backup created
- [ ] Admin staff trained
- [ ] User documentation prepared
- [ ] Support contacts identified
- [ ] Rollback procedure documented
- [ ] Monitoring setup for vote submissions
- [ ] Admin dashboard verified for accuracy
