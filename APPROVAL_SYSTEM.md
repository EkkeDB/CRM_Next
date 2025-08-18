# User Approval and Trader Management System

This document describes the user approval workflow and trader management system implemented in NextCRM.

## Overview

The system implements a comprehensive user approval workflow where:
1. **Traders = Active Users**: Each active Django user maps 1:1 to a Trader record
2. **Per-user data access scoping**: Users have restricted access to commodity types and sociedades
3. **Moderated sign-up**: New signups require admin approval before they can login

## Database Schema Changes

### UserProfile Model Extensions
- `is_approved: bool` - Admin-controlled approval gate (default: False)
- `is_admin: bool` - Admin privileges flag (syncs with Django's is_staff/is_superuser)

### Trader Model Extensions
- `user: OneToOneField` - Links trader to Django user (1:1 relationship)
- `allowed_commodity_types: ManyToManyField` - Commodity types the trader can access
- `allowed_sociedades: ManyToManyField` - Sociedades (companies) the trader can access

## Approval Workflow

### 1. User Registration
- **Frontend**: `/auth/register` page allows new user signup
- **Backend**: `POST /api/auth/register/`
  - Creates user with `is_active=True` but `profile.is_approved=False`
  - Returns message: "Signup received. Pending admin approval."
  - User cannot login until approved

### 2. Admin Approval/Rejection
- **Approve**: `PATCH /api/auth/users/{id}/approve/`
  - Sets `profile.is_approved=True`
  - Creates/links Trader record automatically
  - Sets up default access control (seeds, oil, meal + Sovena España, S.A)
- **Reject**: `PATCH /api/auth/users/{id}/reject/`
  - Sets `profile.is_approved=False` and `is_active=False`

### 3. Login Validation
- Login checks `profile.is_approved` before issuing JWT cookies
- If not approved, returns 403 with message: "Your account is pending admin approval."
- Only approved users receive authentication tokens

## Access Control System

### Data Scoping Rules
- **Superusers/Admins**: Full access to all data
- **Regular Traders**: Limited access based on their allowed commodity types and sociedades
- **Non-Traders**: No access (empty querysets)

### Filtered Endpoints
- `GET /api/commodity-types/` - Filtered by trader's allowed_commodity_types
- `GET /api/sociedades/` - Filtered by trader's allowed_sociedades

### Default Access Control
New approved users automatically get access to:
- **Commodity Types**: seeds, oil, meal
- **Sociedades**: Sovena España, S.A

## Setup and Seeding

### Initial Setup Command
```bash
python manage.py setup_approval_system
```

This command:
1. Creates required commodity types (seeds, oil, meal)
2. Creates required sociedades (Sovena España, S.A)
3. Links existing active users to traders with default access control
4. Auto-approves existing admin users

### Manual User-Trader Linking
```python
# Create/link trader for a user
from apps.nextcrm.models import Trader
trader, created = Trader.get_or_create_for_user(user)

# Set up access control
trader.allowed_commodity_types.set([seeds, oil, meal])
trader.allowed_sociedades.set([sovena])
```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration (returns pending approval message)
- `POST /api/auth/login/` - Login (validates approval status)
- `GET /api/auth/me/` - Returns user profile with `is_approved`, `is_admin`, and `trader_id`

### Admin Management
- `PATCH /api/auth/users/{id}/approve/` - Approve user (creates trader + access control)
- `PATCH /api/auth/users/{id}/reject/` - Reject user (deactivates account)

### Access-Controlled Data
- `GET /api/commodity-types/` - Filtered by user's allowed commodity types
- `GET /api/sociedades/` - Filtered by user's allowed sociedades

## Frontend Components

### Registration Page
- Location: `/auth/register`
- Component: `frontend/src/app/auth/register/page.tsx`
- Shows "Pending approval" message after successful registration
- Does NOT auto-login after signup

### Updated Types
- `User` interface includes `trader_id?: number | null`
- `UserProfile` interface includes `is_approved: boolean` and `is_admin: boolean`
- `Trader` interface includes access control fields

## Testing the Workflow

### 1. Test Registration
```bash
curl -X POST /api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username": "newuser", "email": "test@example.com", "password": "testpass123", "password_confirm": "testpass123", "first_name": "Test", "last_name": "User", "gdpr_consent": true}'
# Expected: {"message": "Signup received. Pending admin approval.", "user_id": X}
```

### 2. Test Unapproved Login
```bash
curl -X POST /api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "newuser", "password": "testpass123"}'
# Expected: {"error": "Your account is pending admin approval..."}
```

### 3. Test Admin Approval
```bash
curl -X PATCH /api/auth/users/{id}/approve/ \
  -H "Authorization: Bearer {admin_token}"
# Expected: {"message": "User approved successfully", "trader_created": true}
```

### 4. Test Approved Login
```bash
curl -X POST /api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "newuser", "password": "testpass123"}'
# Expected: Login successful with trader_id in response
```

### 5. Test Access Control
```bash
# Regular user sees limited data
curl -X GET /api/commodity-types/ -H "Authorization: Bearer {user_token}"
# Admin user sees all data
curl -X GET /api/commodity-types/ -H "Authorization: Bearer {admin_token}"
```

## Security Considerations

1. **Approval Required**: No new user can access the system without admin approval
2. **Data Scoping**: Users only see data they're authorized to access
3. **Trader Validation**: All business operations are scoped to the user's trader record
4. **Admin Override**: Superusers and admins bypass all access control restrictions
5. **Automatic Linking**: Users are automatically linked to traders upon approval

## Migration Notes

- Run `python manage.py migrate` to apply database changes
- Run `python manage.py setup_approval_system` after migration to set up required data
- Existing users will need to be approved or will be auto-approved if they are admins