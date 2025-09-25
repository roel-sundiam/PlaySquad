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
node src/scripts/clearClubs.js                    # Clear all clubs
node src/scripts/searchUserClubs.js <email>       # Find user and their clubs
node src/scripts/deleteUserClub.js <email>        # Delete clubs owned by user
node src/scripts/removeUserFromClub.js <email>    # Remove user from club memberships
```

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

### Coin Packages
```
Starter: ₱249 - 50 coins (no bonus)
Basic: ₱499 - 100 coins + 10 bonus = 110 total
Popular: ₱999 - 250 coins + 50 bonus = 300 total  
Premium: ₱1,999 - 500 coins + 100 bonus = 600 total
Enterprise: ₱3,499 - 1,000 coins + 200 bonus = 1,200 total
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