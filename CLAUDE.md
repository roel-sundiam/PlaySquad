# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PlaySquad is a full-stack sports club matchmaking application with automated doubles team balancing. The project consists of a Node.js/Express backend API and an Angular frontend SPA, designed specifically for organizing sports club events and managing member matchmaking.

## Essential Commands

### Backend Development
```bash
cd backend
npm run dev          # Start development server with hot reload (nodemon)
npm start            # Production server start
npm test             # Run Jest test suite
npm run seed         # Populate database with test data (25 users, 8 clubs, 8 events)
npm run clear-clubs  # Clear all club data from database
```

### Frontend Development
```bash
cd frontend
ng serve             # Development server at http://localhost:4200
ng build             # Production build
ng test              # Run Karma/Jasmine tests
ng build --watch     # Continuous build during development
```

### Database Management
```bash
# Custom utility scripts in backend/src/scripts/
node src/scripts/clearAllData.js                  # Clear ALL data (clubs, events, messages, analytics, coins)
node src/scripts/clearAllData.js --verify         # Check current database state
node src/scripts/addTestUsers.js                  # Create 8 test users (4 male, 4 female)
node src/scripts/addTestUsers.js --list           # List all test users
node src/scripts/addTestUsers.js --remove         # Remove all test users
node src/scripts/clearClubs.js                    # Clear all clubs only
node src/scripts/searchUserClubs.js <email>       # Find user and their clubs
node src/scripts/deleteUserClub.js <email>        # Delete clubs owned by user
node src/scripts/removeUserFromClub.js <email>    # Remove user from club memberships
```

#### Complete Data Cleanup Script
The `clearAllData.js` script provides comprehensive database cleanup:
- **Deletes**: Clubs, Events, Messages, Site Analytics, Coin Transactions, Purchase Requests, Notifications, Push Subscriptions
- **Preserves**: User accounts (but clears club memberships and coin wallets)
- **Features**: Parallel deletion, verification, detailed progress reporting
- **Usage**: Run from `backend/` directory with `node src/scripts/clearAllData.js`

#### Test Users Script
The `addTestUsers.js` script manages test user accounts:
- **Creates**: 8 test users (4 male, 4 female) with realistic profiles
- **Password**: All users have password `password123`
- **Users**: Alex Johnson, David Smith, Michael Brown, James Wilson (males); Sarah Davis, Emma Miller, Jessica Garcia, Ashley Martinez (females)
- **Features**: Skill levels 5-8, various play preferences, phone numbers, email verification
- **Management**: Create, list, or remove test users with command options

## User Login Credentials

### Admin Accounts
| Name | Email | Password | Role | Notes |
|------|--------|----------|------|-------|
| Super Admin | `superadmin@playsquad.com` | `SuperAdmin123!` | Super Admin | Full coin purchase management |
| Test Admin | `admin@test.com` | `TestAdmin123!` | Admin | Alternative admin account |
| Test Admin | `testadmin@test.com` | `password123` | Admin | Basic admin account |

### Test Users (Created by addTestUsers.js)
| Name | Email | Password | Gender | Skill Level | Preferred Format |
|------|--------|----------|---------|-------------|------------------|
| Alex Johnson | `alex.johnson@test.com` | `password123` | Male | 7 | Doubles |
| David Smith | `david.smith@test.com` | `password123` | Male | 6 | Singles |
| Michael Brown | `michael.brown@test.com` | `password123` | Male | 8 | Any |
| James Wilson | `james.wilson@test.com` | `password123` | Male | 5 | Mixed |
| Sarah Davis | `sarah.davis@test.com` | `password123` | Female | 6 | Doubles |
| Emma Miller | `emma.miller@test.com` | `password123` | Female | 7 | Singles |
| Jessica Garcia | `jessica.garcia@test.com` | `password123` | Female | 8 | Mixed |
| Ashley Martinez | `ashley.martinez@test.com` | `password123` | Female | 5 | Any |

### Existing Users
| Name | Email | Password | Notes |
|------|--------|----------|-------|
| Roel Sundiam | `sundiamr@aol.com` | `password123` | Existing user (skill 5) |
| Helen Sundiam | `sundiamhelen@yahoo.com` | `password123` | Existing user (skill 5) |

**Total Users**: 13 (3 admin accounts + 8 test users + 2 existing users)
**Admin Dashboard Shows**: 10 users (excludes 3 admin accounts with "admin" in email)

## Architecture Overview

### Backend Structure
- **Entry Point**: `backend/src/server.js`
- **Database**: MongoDB with Mongoose ODM, Atlas cloud hosting
- **Authentication**: JWT tokens with 24-hour expiry, bcrypt password hashing
- **Security**: Helmet, CORS, rate limiting, express-validator
- **Real-time**: Socket.IO for club messaging

### Frontend Structure
- **Framework**: Angular 16.2+ with TypeScript, SCSS styling
- **Architecture**: Component-based with centralized services
- **State Management**: RxJS observables, localStorage for auth tokens
- **Routing**: Protected routes with AuthGuard

### Core Data Models

**User Model** (`backend/src/models/User.js`):
- Authentication fields, profile data, sport preferences
- Club memberships array with roles (member/organizer/admin)
- Skill level (1-10), game statistics, virtual properties

**Club Model** (`backend/src/models/Club.js`):
- Member management with role-based permissions
- Join requests system with approval workflow (`autoAcceptMembers: false`)
- Privacy settings (public/private with invite codes)
- Settings: maxMembers, skill level ranges, guest policies

**Event Model** (`backend/src/models/Event.js`):
- RSVP management, automated match generation algorithms
- Court assignments, score tracking, skill-balanced team creation

## API Architecture

### Authentication (`/api/auth/`)
- `POST /register` - User registration with validation
- `POST /login` - JWT authentication
- `GET /me` - Current user profile
- `PUT /me` - Update profile
- `PUT /change-password` - Secure password updates

### Clubs (`/api/clubs/`)
- `GET /` - User's clubs (member-only view)
- `GET /browse` - All public clubs (discovery)
- `POST /:id/join` - Join club (creates approval request if `autoAcceptMembers: false`)
- `GET /:id/requests` - View pending join requests (admin only)
- `PUT /:id/requests/:requestId` - Approve/reject join requests

### Role-Based Permissions
1. **Club Owner**: Ultimate permissions, cannot be removed
2. **Admin**: Full management except deletion
3. **Organizer**: Event management, limited member control
4. **Member**: Basic participation rights

## Key Implementation Details

### Join Approval System
- New clubs default to `autoAcceptMembers: false`
- Join requests create entries in `club.joinRequests[]` array
- Admins see "Manage Requests" button with approve/reject options
- Frontend shows "Join request submitted!" for pending requests

### Match Generation Algorithm
Located in Event model, creates balanced doubles teams by:
- Sorting players by skill level
- Pairing strongest with weakest for team balance
- Distributing across available courts
- Supporting both singles and doubles formats

### Frontend Service Layer
- **AuthService**: JWT management, user state, route protection
- **ApiService**: HTTP client wrapper with automatic auth headers
- **ClubService**: CRUD operations, join requests, member management
- **EventService**: Event management, RSVP functionality

### Database Relationships
- Users have `clubs[]` array with role references
- Clubs have `members[]` and `joinRequests[]` arrays
- Referential integrity maintained through Mongoose population

## Development Workflow

### Environment Setup
Required environment variables in `backend/.env`:
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
PORT=3000
NODE_ENV=development
```

### Testing Strategy
- Comprehensive testing guide at `/TESTING_GUIDE.md`
- API endpoint testing with Supertest
- Permission boundary validation
- End-to-end user journey testing

### Design System
- Primary color: #00C853 (tennis court green)
- Typography: Inter & Poppins fonts
- Mobile-first responsive design
- 8px grid spacing system

## Common Development Patterns

### Error Handling
- Consistent API response format: `{ success: boolean, message: string, data?: any }`
- Frontend uses RxJS error handling in service subscriptions
- Centralized validation with express-validator

### Security Considerations
- JWT tokens in Authorization Bearer headers
- Protected routes require valid user authentication
- Role-based middleware for club operations
- Input sanitization and validation on all endpoints

### Real-time Features
- Socket.IO rooms for club communication (`club-${clubId}`)
- Connection management in `server.js`
- Room-based messaging system

## Development Guidelines

### UI/UX Standards
- **Never use JavaScript popup dialogs** (`alert()`, `prompt()`, `confirm()`) - these are not mobile-friendly and break the professional design
- **Always use modern, mobile-friendly modals** that match the app's design system
- Implement custom modal components with proper SCSS styling and responsive behavior
- Use Angular's component-based modals for better user experience and accessibility

When working with this codebase, always run the seed script first to populate test data, and remember that the club join system now requires admin approval by default.

## Coin Purchase System

PlaySquad includes a comprehensive coin-based monetization system with approval-based purchasing for clubs.

### System Overview
- **Club-level coin consumption**: Clubs spend coins on premium features
- **Approval-based purchases**: All coin purchases require superadmin approval
- **Philippine Peso pricing**: Packages range from ₱249 to ₱3,499
- **Multiple payment methods**: GCash, Bank Transfer, Cash payments
- **Complete audit trail**: All transactions tracked with admin notes

### Coin Packages (1 peso = 1 coin + volume discounts)
```
Starter: ₱249 - 249 coins (0% bonus)
Basic: ₱499 - 499 coins + 5% bonus (25 coins) = 524 total
Popular: ₱999 - 999 coins + 10% bonus (100 coins) = 1,099 total
Premium: ₱1,999 - 1,999 coins + 15% bonus (300 coins) = 2,299 total
Enterprise: ₱3,499 - 3,499 coins + 20% bonus (700 coins) = 4,199 total
```

### Admin Accounts
**Super Admin:**
- Email: `superadmin@playsquad.com`
- Password: `SuperAdmin123!`
- Access: Full coin purchase request management at `/admin/coin-requests`

**Test Admin (Alternative):**
- Email: `admin@test.com` 
- Password: `TestAdmin123!`

### Purchase Workflow
1. **Club Request**: Club admins create purchase requests through club coin wallet
2. **Payment Details**: Forms for GCash/Bank Transfer/Cash payment information
3. **Admin Review**: Superadmin reviews and approves/rejects requests
4. **Automatic Processing**: Approved requests automatically grant coins to clubs

### Key Components
- `ClubCoinWalletComponent`: Club-side purchase request interface
- `CoinPurchaseRequestsComponent`: Admin approval interface at `/admin/coin-requests`
- `CoinPurchaseRequest` model: Database schema with approval workflow
- Admin API routes: `/api/admin/coin-purchase-requests`

### Creating Additional Admins
Run the script to create admin accounts:
```bash
node src/scripts/createSuperAdmin.js
```

## Git Operations

### "Go Git" Trigger Phrase
- **Trigger phrase**: When you say **"go git"**, I will automatically handle all git operations (add, commit, push)