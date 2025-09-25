# PlaySquad App Workflow Process

## Overview
PlaySquad is a sports club matchmaking application that enables users to create, join, and manage sports clubs for racquet sports (tennis, badminton, squash, table tennis, pickleball). The platform follows a community-driven model with hierarchical role-based permissions.

## Table of Contents
1. [User Registration & Authentication](#user-registration--authentication)
2. [Club Creation Process](#club-creation-process)
3. [Club Membership Workflow](#club-membership-workflow)
4. [Role Management System](#role-management-system)
5. [Permission Structure](#permission-structure)
6. [API Endpoints Reference](#api-endpoints-reference)

---

## User Registration & Authentication

### Registration Process
**Location**: `backend/src/routes/auth.js:36`

1. **User Provides**:
   - First Name & Last Name (2-50 characters)
   - Email (unique, validated)
   - Password (minimum 6 characters)
   - Skill Level (1-10, optional, default: 5)
   - Preferred Format (singles/doubles/mixed/any, optional, default: any)
   - Phone Number (optional)

2. **System Actions**:
   - Validates input data
   - Checks email uniqueness
   - Hashes password with bcrypt
   - Creates user record
   - Generates JWT token
   - Returns user profile with token

3. **Default User Settings**:
   - Skill Level: 5 (intermediate)
   - Preferred Format: "any"
   - Email Verified: false
   - Initial Stats: 0 games/wins/losses

### Authentication Flow
**Location**: `backend/src/middleware/auth.js:4`

1. **Login Process**:
   - Email/password validation
   - Password comparison using bcrypt
   - JWT token generation (24h expiry)
   - Last active timestamp update

2. **Token Management**:
   - Bearer token format: `Authorization: Bearer <token>`
   - Automatic expiry after 24 hours
   - Server-side validation on protected routes

3. **Password Management**:
   - Change password (requires current password)
   - Forgot password (crypto token generation)
   - Reset password (token validation)

---

## Club Creation Process

### Who Can Create Clubs
**Any authenticated user** can create a club immediately without approval.

### Creation Workflow
**Location**: `backend/src/routes/clubs.js:101`

1. **User Submits**:
   - Club name (3-100 characters)
   - Description (max 500 characters, optional)
   - Sport type (tennis/badminton/squash/table-tennis/pickleball)
   - Location name and address
   - Privacy setting (public/private)
   - Coordinates (optional)

2. **System Actions**:
   - Validates all input data
   - Creates club record with user as owner
   - Automatically adds creator as admin member
   - Updates user's clubs array
   - Generates invite code for private clubs
   - Returns populated club data

3. **Default Club Settings**:
   - Max Members: 100
   - Allow Guest Players: false
   - Auto Accept Members: true
   - Skill Level Range: 1-10
   - Status: Active

### Club Configuration Options
**Location**: `backend/src/models/Club.js:68`

- **Privacy**: Public (discoverable) vs Private (invite-only)
- **Member Capacity**: Maximum number of members (default: 100)
- **Skill Level Filter**: Min/max skill requirements (1-10 scale)
- **Guest Policy**: Allow non-members in events
- **Join Approval**: Automatic vs manual member approval

---

## Club Membership Workflow

### Joining Public Clubs
**Location**: `backend/src/routes/clubs.js:239`

1. **Prerequisites**:
   - User must be authenticated
   - Club must be active and public
   - Club must have available capacity
   - User skill level must fit club requirements

2. **Join Process**:
   - User submits join request
   - System validates eligibility
   - Adds user to club members (role: member)
   - Updates user's clubs array
   - Returns updated club data

3. **Automatic Validation**:
   - Prevents duplicate membership
   - Checks skill level compatibility
   - Enforces member capacity limits

### Joining Private Clubs
**Requirements**:
- All public club requirements
- Valid invite code from club organizers
- Code validation against club's stored invite code

### Leaving Clubs
**Location**: `backend/src/routes/clubs.js:322`

1. **Standard Members**: Can leave anytime
2. **Club Owner**: Cannot leave directly
   - Must transfer ownership first
   - System prevents owner departure

3. **Leave Process**:
   - Marks member as inactive (soft delete)
   - Removes club from user's clubs array
   - Updates club member count

---

## Role Management System

### Role Hierarchy
**Location**: `backend/src/models/Club.js:54`

1. **Owner** (Highest Authority)
   - Club creator
   - Cannot be removed or demoted
   - Has all admin permissions
   - Only one per club

2. **Admin**
   - Full club management permissions
   - Can assign/remove any role except owner
   - Can remove any member including other admins
   - Multiple admins allowed

3. **Organizer**
   - Can edit club details and settings
   - Can manage events and activities
   - Can manage regular members only
   - Cannot remove admins or other organizers

4. **Member** (Basic Role)
   - Can participate in club activities
   - Can view club information
   - Can join events
   - Default role for new members

### Role Assignment Rules
**Location**: `backend/src/routes/clubs.js:361`

- **Admin → Any Role**: Admins can assign any role to any member
- **Organizer → Member Only**: Organizers can only manage regular members
- **Owner Protection**: Owner role cannot be changed or removed
- **Self-Assignment Prevention**: Users cannot promote themselves

### Member Management Actions
**Location**: `backend/src/routes/clubs.js:425`

- **Add Members**: Through join process or admin invitation
- **Remove Members**: Organizers+ can remove members (role restrictions apply)
- **Role Changes**: Admins can change member roles
- **Owner Transfer**: Requires separate process (future feature)

---

## Permission Structure

### Public Access (No Authentication)
- Browse public clubs
- View club basic information
- Search clubs by sport/location
- User registration

### Authenticated User Access
**Middleware**: `protect`
- Create new clubs
- Join public clubs
- Update own profile
- Access personal dashboard

### Club Member Access
**Middleware**: `clubMember`
- View full club details
- Participate in club events
- Access member-only content
- Leave club

### Club Organizer Access
**Middleware**: `clubOrganizer`
- Edit club settings and information
- Manage club members (limited)
- Create and manage events
- Access club analytics

### Club Admin/Owner Access
**Full Permissions**:
- All organizer permissions
- Assign/remove roles
- Remove any member
- Delete club (owner only)
- Manage club privacy settings

---

## API Endpoints Reference

### Authentication Endpoints
```
POST /api/auth/register     - User registration
POST /api/auth/login        - User login
GET  /api/auth/me          - Get current user profile
PUT  /api/auth/me          - Update user profile
POST /api/auth/logout      - User logout
PUT  /api/auth/change-password - Change password
POST /api/auth/forgot-password - Forgot password
PUT  /api/auth/reset-password/:token - Reset password
```

### Club Management Endpoints
```
GET    /api/clubs              - List clubs (public)
GET    /api/clubs/:id          - Get club details
POST   /api/clubs              - Create new club [Auth Required]
PUT    /api/clubs/:id          - Update club [Organizer+ Required]
DELETE /api/clubs/:id          - Delete club [Owner Required]
```

### Membership Endpoints
```
POST   /api/clubs/:id/join     - Join club [Auth Required]
POST   /api/clubs/:id/leave    - Leave club [Member Required]
PUT    /api/clubs/:id/members/:userId/role - Update member role [Organizer+ Required]
DELETE /api/clubs/:id/members/:userId      - Remove member [Organizer+ Required]
```

### Query Parameters
- **Pagination**: `?page=1&limit=10`
- **Sport Filter**: `?sport=tennis`
- **Search**: `?search=downtown`
- **Include Private**: `?includePrivate=true` (authenticated users only)

---

## Security Considerations

### Data Protection
- Passwords hashed with bcrypt (12 rounds)
- JWT tokens for stateless authentication
- Input validation on all endpoints
- SQL injection prevention (MongoDB)

### Access Control
- Role-based permissions enforced at middleware level
- Club privacy respected in queries
- Owner protection from unauthorized changes
- Skill level and capacity validation

### Rate Limiting
- Express rate limiting middleware
- CORS configuration for frontend access
- Helmet for security headers
- Morgan for request logging

---

## Database Schema References

### User Model
**File**: `backend/src/models/User.js`
- Authentication data (email, password)
- Profile information (name, skill level, preferences)
- Club memberships with roles
- Game statistics

### Club Model
**File**: `backend/src/models/Club.js`
- Basic information (name, description, sport)
- Location and privacy settings
- Member list with roles and join dates
- Configuration settings and statistics

### Member Relationship
- Users have clubs array with role information
- Clubs have members array with user references
- Bidirectional relationship maintained automatically

---

## Future Enhancements

### Potential Additions
1. **Event Management**: Schedule matches and tournaments
2. **Rating System**: Member ratings and reviews
3. **Payment Integration**: Membership fees and court bookings
4. **Chat System**: Club communication features
5. **Mobile App**: Native iOS/Android applications
6. **Advanced Analytics**: Club and player statistics
7. **Owner Transfer**: Formal ownership transfer process

### Scalability Considerations
- Database indexing for search optimization
- Caching layer for frequently accessed data
- Image storage for avatars and club photos
- Push notifications for mobile users
- Geographic search optimization

---

*Last Updated: 2025-09-20*
*Version: 1.0*