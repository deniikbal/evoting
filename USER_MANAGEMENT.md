# User Management & Role-Based Access Control

## Overview

E-Voting system now supports role-based admin management with two distinct roles: **Admin** and **SuperAdmin**. This provides granular control over who can manage the system and view voting results during active voting sessions.

## Roles & Permissions

### Admin (🔐)
- **Permissions:**
  - View all data (siswa, pegawai, kandidat, kelas)
  - Edit and manage non-sensitive data
  - Cannot access Manajemen Admin page
  - **Cannot view voting results while voting is active**
  - Can reset voting (after voting completes)

- **Restrictions:**
  - No access to /admin/user
  - Cannot create, edit, or delete other admins
  - Results voting button hidden during active voting
  - Redirected if attempting direct access

### SuperAdmin (🔓)
- **Permissions:**
  - Full system access
  - Access to /admin/user for admin management
  - Can create, edit, delete admin accounts
  - **Can view voting results even during active voting**
  - Can monitor live voting progress
  - Can reset voting anytime

- **Capabilities:**
  - User Management (create/edit/delete admins)
  - Change admin roles
  - Full results visibility
  - All data management functions

## Database Schema

### admin table

```sql
CREATE TABLE admin (
  id SERIAL PRIMARY KEY,
  username VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',     -- NEW: 'admin' or 'superadmin'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()    -- NEW
)
```

**Roles:**
- `admin` - Regular admin (default)
- `superadmin` - Super admin (unrestricted)

## API Endpoints

### User Management APIs (SuperAdmin Only)

#### GET `/api/admin/user`
Fetch all admin accounts.

**Response:**
```json
[
  {
    "id": 1,
    "username": "admin1",
    "role": "admin",
    "createdAt": "2025-11-14T10:00:00Z"
  },
  {
    "id": 2,
    "username": "superadmin",
    "role": "superadmin",
    "createdAt": "2025-11-14T09:00:00Z"
  }
]
```

#### POST `/api/admin/user`
Create new admin account.

**Request:**
```json
{
  "username": "newadmin",
  "password": "securepassword123",
  "role": "admin"  // or "superadmin"
}
```

**Response:**
```json
{
  "message": "Admin berhasil dibuat",
  "data": {
    "id": 3,
    "username": "newadmin",
    "role": "admin"
  }
}
```

#### PUT `/api/admin/user/[id]`
Update admin role.

**Request:**
```json
{
  "role": "superadmin"
}
```

**Response:**
```json
{
  "message": "Admin berhasil diperbarui",
  "data": {
    "id": 3,
    "username": "newadmin",
    "role": "superadmin"
  }
}
```

#### DELETE `/api/admin/user/[id]`
Delete admin account (prevented if only 1 admin left).

**Response:**
```json
{
  "message": "Admin berhasil dihapus"
}
```

## User Interface

### Login Page
Shows login form that accepts admin credentials. Session includes role information.

### Manajemen Admin Page (`/admin/user`)
- **Visibility:** SuperAdmin only
- **Features:**
  - List of all admin accounts with role badges
  - Add new admin button
  - Edit role button
  - Delete admin button (with confirmation)
  - Shows creation date
  - Prevents deleting last admin

### Navigation Menu
- **Desktop:** Hidden User button visible only for SuperAdmin
- **Mobile:** Hidden User button visible only for SuperAdmin
- Shield icon (🛡️) indicates admin management

### Access Restrictions
- **Admin users:**
  - Hasil Voting button hidden during active voting
  - Redirected if accessing /admin/hasil directly during voting
  - Error toast shown: "Hasil voting tidak bisa dilihat saat voting berlangsung"

- **SuperAdmin users:**
  - All buttons and pages always visible
  - Full access regardless of voting status

## Session Management

Admin session stored in `localStorage` as `adminSession`:

```json
{
  "id": 1,
  "username": "admin1",
  "role": "admin",  // or "superadmin"
  "createdAt": "2025-11-14T10:00:00Z"
}
```

Role is checked in components to control visibility and access.

## Access Control Logic

### During Active Voting

```
IF voting.votingAktif == true:
  IF admin.role == "admin":
    HIDE "Hasil Voting" button
    REDIRECT from /admin/hasil to /admin/dashboard
    SHOW error: "Hasil voting tidak bisa dilihat saat voting berlangsung"
  ELSE IF admin.role == "superadmin":
    SHOW "Hasil Voting" button
    ALLOW access to /admin/hasil
    DISPLAY live voting results
```

### During Inactive Voting

```
IF voting.votingAktif == false:
  FOR ALL admins (admin and superadmin):
    SHOW "Hasil Voting" button
    ALLOW access to /admin/hasil
    DISPLAY voting results
```

## Creating Admin Accounts

### Initial Setup
Default admin is created during initial setup with role "admin".

### Adding New Admins
SuperAdmin can add new admins via /admin/user page:

1. Click "Tambah Admin"
2. Enter username
3. Enter password (hashed with bcrypt)
4. Select role (admin or superadmin)
5. Click "Simpan"

**Password Requirements:**
- Hashed with bcrypt (10 salt rounds)
- Never stored in plain text
- Never returned in API responses

### Changing Admin Roles
SuperAdmin can change any admin's role:

1. Click "Edit" on target admin
2. Select new role from dropdown
3. Click "Simpan"
4. Changes take effect immediately

### Deleting Admins
SuperAdmin can delete admins (except last one):

1. Click "Hapus" on target admin
2. Confirm deletion
3. Confirmation shows if only 1 admin left (prevents deletion)

## Security Considerations

### Password Security
- All passwords hashed with bcrypt (10 salt rounds)
- Plain passwords never stored or logged
- Never returned in API responses
- Cannot edit existing password via UI (only create new)

### Role Validation
- Role must be "admin" or "superadmin"
- Invalid roles rejected by API
- UI only shows valid options

### Last Admin Protection
- Cannot delete last admin account
- System prevents orphaning
- Admin count checked before deletion

### Session Security
- Session stored only in localStorage
- Role checked for each restricted page
- Direct URL access redirected if unauthorized
- Error messages don't leak information

## Workflow Examples

### Example 1: Regular Admin During Active Voting

```
1. Admin logs in
2. Dashboard loads, shows voting is active
3. Admin clicks "Hasil Voting" button → BUTTON HIDDEN
4. Admin tries to access /admin/hasil directly
   → Redirected to /admin/dashboard
   → Toast: "Hasil voting tidak bisa dilihat saat voting berlangsung"
5. Admin waits for voting to finish
6. After voting ends, Hasil Voting becomes visible
```

### Example 2: SuperAdmin During Active Voting

```
1. SuperAdmin logs in
2. Dashboard loads, shows voting is active
3. SuperAdmin clicks "Hasil Voting" button → VISIBLE
4. SuperAdmin views live voting results
5. Can see real-time vote counts
6. Can monitor voting progress
```

### Example 3: Creating New SuperAdmin

```
1. Current SuperAdmin goes to /admin/user
2. Clicks "Tambah Admin"
3. Fills form:
   - Username: "manager"
   - Password: "securepass123"
   - Role: "SuperAdmin"
4. Clicks "Simpan"
5. New SuperAdmin can now:
   - Access /admin/user
   - View voting results anytime
   - Create/edit/delete other admins
```

## Testing Checklist

- [ ] Create admin account via /admin/user (SuperAdmin)
- [ ] Edit admin role (admin → superadmin)
- [ ] Login as admin user
- [ ] Verify Hasil Voting button visible when voting inactive
- [ ] Enable voting
- [ ] Verify Hasil Voting button hidden for admin
- [ ] Try direct access to /admin/hasil, verify redirect
- [ ] Check error toast message
- [ ] Login as SuperAdmin
- [ ] Verify Hasil Voting always visible
- [ ] Verify direct access to /admin/hasil works
- [ ] Delete admin account (SuperAdmin)
- [ ] Try to delete last admin, verify prevention
- [ ] Change admin role to superadmin
- [ ] Verify new permissions take effect immediately

## Related Pages

- `/admin/user` - User Management (SuperAdmin only)
- `/admin/dashboard` - Main dashboard
- `/admin/hasil` - Voting results (restricted for Admin)
- `/login/admin` - Admin login
- `src/app/api/admin/user` - User CRUD APIs

## Future Enhancements

- [ ] Password change functionality
- [ ] Admin activity audit log
- [ ] Two-factor authentication
- [ ] Admin session timeout
- [ ] Role-based feature flags
- [ ] Granular permission control
