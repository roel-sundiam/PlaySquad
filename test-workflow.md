# PlaySquad Complete Workflow Testing Guide

## 🎯 Test the Complete User Journey

### Prerequisites
1. **Start the backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Seed the database with sample data**:
   ```bash
   cd backend  
   npm run seed
   ```

3. **Start the frontend**:
   ```bash
   cd frontend
   ng serve
   ```

4. **Access the app**: http://localhost:4200

---

## 📋 Testing Workflow

### 1. User Registration & Authentication
- ✅ **Register new user**: Fill out registration form with skill level
- ✅ **Login**: Use email/password from seeded users or new account
- ✅ **Profile management**: Update skill level, preferred format

### 2. Browse and Join Clubs  
- ✅ **Browse clubs**: View all seeded clubs with different sports
- ✅ **Search/Filter**: Test sport filtering and search functionality
- ✅ **Join public club**: Simple one-click join process
- ✅ **Join private club**: Requires invite code (check console logs for codes)
- ✅ **View club details**: See members, stats, upcoming events

### 3. Create Your Own Club
- ✅ **Create club**: Use "Create Club" button with all required fields
- ✅ **Verify ownership**: Creator becomes admin automatically
- ✅ **Manage members**: Invite others, assign roles

### 4. Events & Matchmaking
- ✅ **View events**: See upcoming events from joined clubs
- ✅ **RSVP to events**: Join events with skill level requirements
- ✅ **Create events**: Club organizers can schedule new events
- ✅ **Generate matches**: Auto-create balanced singles/doubles matches
- ✅ **Score tracking**: Record match results and winners

### 5. Permission Testing
- ✅ **Member permissions**: Basic event participation
- ✅ **Organizer permissions**: Event creation, member management
- ✅ **Admin permissions**: Full club control, role assignment
- ✅ **Owner permissions**: Club deletion, ownership transfer

---

## 🔍 API Testing with Sample Data

### Test Users Created (25 users)
- Email pattern: `firstname.lastname@example.com`
- Password: `password123` (for all test users)
- Skill levels: 1-10 distributed across users
- Various preferred formats: singles, doubles, mixed, any

**Example Test Users:**
- alex.chen@example.com (Skill: 7, Singles)
- maria.rodriguez@example.com (Skill: 5, Doubles)  
- james.wilson@example.com (Skill: 8, Any)

### Test Clubs Created (8 clubs)
- **Downtown Tennis Club** - Public, skill 1-10
- **Elite Badminton Society** - Private, skill 5-10
- **Squash Racquet Club** - Public, skill 2-9
- **University Table Tennis League** - Public, skill 1-8
- **Pickleball Paradise** - Public, skill 1-7
- **Westside Tennis Academy** - Private, skill 3-10
- **Casual Badminton Meetup** - Public, skill 1-6
- **Champions Squash League** - Private, skill 7-10

### Test Events Created (8 events)
- Various sports and formats
- Different skill level requirements
- Scheduled for next 3 weeks
- Mix of free and paid events

---

## ✅ Key Features to Verify

### Backend API Endpoints
```bash
# Test with curl or Postman
GET /api/clubs - Browse clubs
POST /api/auth/login - User authentication  
POST /api/clubs/{id}/join - Join club
GET /api/events - View events
POST /api/events/{id}/rsvp - RSVP to event
```

### Frontend Integration
- ✅ **Responsive design** - Works on mobile/desktop
- ✅ **Real-time updates** - UI updates after API calls
- ✅ **Error handling** - Proper error messages
- ✅ **Authentication flow** - Login/logout functionality
- ✅ **Role-based UI** - Different options for different roles

### Database Relationships
- ✅ **User ↔ Club memberships** - Bidirectional relationship
- ✅ **Club ↔ Event ownership** - Events belong to clubs
- ✅ **Event ↔ RSVP tracking** - User participation
- ✅ **Match generation** - Automatic player pairing

---

## 🐛 Common Issues & Solutions

### Backend Issues
- **MongoDB connection**: Ensure MongoDB is running
- **Port conflicts**: Backend runs on :3000, frontend on :4200
- **Environment variables**: Check .env file for JWT_SECRET

### Frontend Issues  
- **CORS errors**: Ensure backend allows frontend origin
- **Token expiry**: JWT tokens expire after 24h
- **API endpoint mismatch**: Verify environment.ts API URL

### Data Issues
- **Empty lists**: Run `npm run seed` to populate data
- **Permission denied**: User must be club member for restricted actions
- **Skill level mismatch**: Check event skill requirements

---

## 🚀 Success Criteria

**✅ Complete workflow working when:**
1. Users can register, login, and update profiles
2. Users can browse, search, and join clubs
3. Club owners/organizers can create and manage events
4. Users can RSVP to events and generate matches
5. Score tracking and match results work properly
6. All role-based permissions function correctly
7. Frontend and backend integrate seamlessly

---

## 📊 Performance Verification

### Expected Response Times
- **Club listing**: < 500ms
- **User authentication**: < 300ms
- **Event creation**: < 800ms
- **Match generation**: < 1000ms

### Scalability Tests
- **Multiple users**: Test with 20+ concurrent RSVPs
- **Large events**: Create events with max participants
- **Search performance**: Filter clubs with various criteria

---

*Run this complete test suite to verify the PlaySquad application is working end-to-end!*