# PlaySquad Complete Testing Guide
## From Registration to Match Completion

*Comprehensive end-to-end testing documentation for the PlaySquad sports club matchmaking application*

---

## 📋 Table of Contents
1. [Setup & Prerequisites](#setup--prerequisites)
2. [User Registration & Authentication](#1-user-registration--authentication)
3. [Profile Management](#2-profile-management) 
4. [Club Discovery & Joining](#3-club-discovery--joining)
5. [Club Creation & Management](#4-club-creation--management)
6. [Event Participation](#5-event-participation)
7. [Match Generation & Scoring](#6-match-generation--scoring)
8. [Role-Based Permissions](#7-role-based-permissions)
9. [API Testing Examples](#8-api-testing-examples)
10. [Edge Cases & Error Handling](#9-edge-cases--error-handling)
11. [Performance Testing](#10-performance-testing)

---

## Setup & Prerequisites

### Environment Setup
```bash
# 1. Start MongoDB (if using local instance)
mongod

# 2. Install dependencies and seed database
cd backend
npm install
npm run seed

# 3. Start backend server
npm run dev
# ✅ Server should start on http://localhost:3000

# 4. Start frontend (new terminal)
cd frontend
npm install
ng serve
# ✅ Frontend should start on http://localhost:4200
```

### Verify Setup
- ✅ **Backend Health**: Visit http://localhost:3000/api/clubs
- ✅ **Frontend Loading**: Visit http://localhost:4200
- ✅ **Database Seeded**: Should see clubs list in API response

### Test Data Available
- **25 Users**: alex.chen@example.com to tyler.green@example.com
- **8 Clubs**: Various sports and privacy settings
- **8 Events**: Scheduled for next 3 weeks
- **Default Password**: `password123` for all seeded users

---

## 1. User Registration & Authentication

### 1.1 New User Registration

**Test Case**: Register a completely new user

**Steps**:
1. Navigate to http://localhost:4200
2. Click "Register" or "Sign Up"
3. Fill registration form:
   ```
   First Name: John
   Last Name: Tester
   Email: john.tester@example.com
   Password: testpass123
   Skill Level: 6
   Preferred Format: doubles
   Phone: +1-555-9999
   ```
4. Click "Register"

**Expected Results**:
- ✅ User redirected to dashboard
- ✅ JWT token stored in localStorage
- ✅ User profile displays correctly
- ✅ Navigation shows authenticated state

**API Validation**:
```bash
# Verify user creation
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Tester", 
    "email": "john.tester@example.com",
    "password": "testpass123",
    "skillLevel": 6,
    "preferredFormat": "doubles"
  }'
```

**Success Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Tester",
    "email": "john.tester@example.com",
    "skillLevel": 6,
    "preferredFormat": "doubles"
  }
}
```

### 1.2 User Login

**Test Case**: Login with existing user

**Steps**:
1. Logout if currently authenticated
2. Click "Login"
3. Enter credentials:
   ```
   Email: alex.chen@example.com
   Password: password123
   ```
4. Click "Login"

**Expected Results**:
- ✅ Successful authentication
- ✅ Dashboard loads with user data
- ✅ User clubs and stats visible

**API Validation**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex.chen@example.com",
    "password": "password123"
  }'
```

### 1.3 Authentication Persistence

**Test Case**: Verify login persistence across browser sessions

**Steps**:
1. Login successfully
2. Close browser completely
3. Reopen browser and navigate to application
4. Should remain logged in

**Expected Results**:
- ✅ User stays authenticated
- ✅ No re-login required
- ✅ User data loads automatically

### 1.4 Logout Functionality

**Test Case**: Secure logout process

**Steps**:
1. While authenticated, click "Logout"
2. Verify redirection to login page
3. Try accessing protected routes directly

**Expected Results**:
- ✅ JWT token removed from localStorage
- ✅ Redirected to login page
- ✅ Protected routes redirect to authentication

---

## 2. Profile Management

### 2.1 View Profile Information

**Test Case**: Access and view user profile

**Steps**:
1. Login as test user
2. Navigate to profile section
3. Verify all information displays correctly

**Expected Data**:
- ✅ Personal information (name, email)
- ✅ Sports preferences (skill level, format)
- ✅ Club memberships with roles
- ✅ Game statistics (wins, losses, games played)

### 2.2 Update Profile

**Test Case**: Modify user profile information

**Steps**:
1. Access profile edit form
2. Update fields:
   ```
   Skill Level: 7 → 8
   Preferred Format: singles → doubles
   Phone: Add/update number
   ```
3. Save changes

**Expected Results**:
- ✅ Changes saved successfully
- ✅ Updated data reflects immediately
- ✅ No data corruption

**API Validation**:
```bash
# Get current user profile
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Update profile
curl -X PUT http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "skillLevel": 8,
    "preferredFormat": "doubles"
  }'
```

### 2.3 Password Change

**Test Case**: Change user password securely

**Steps**:
1. Access password change form
2. Enter:
   ```
   Current Password: password123
   New Password: newpassword456
   Confirm Password: newpassword456
   ```
3. Submit form
4. Logout and login with new password

**Expected Results**:
- ✅ Password updated successfully
- ✅ Can login with new password
- ✅ Cannot login with old password

---

## 3. Club Discovery & Joining

### 3.1 Browse All Clubs

**Test Case**: View available clubs

**Steps**:
1. Navigate to clubs page
2. Observe club listings
3. Test pagination if more than 12 clubs

**Expected Results**:
- ✅ All public clubs displayed
- ✅ Club information accurate (name, sport, location, members)
- ✅ Privacy indicators for private clubs
- ✅ Pagination works correctly

**Visual Elements to Verify**:
- Club avatars/images
- Member count and statistics
- Sport type clearly indicated
- Location information
- "Join" vs "Member" buttons

### 3.2 Search and Filter Clubs

**Test Case**: Find specific clubs using search

**Steps**:
1. Use search bar: "tennis"
2. Verify only tennis clubs appear
3. Clear search, use sport filter: "Badminton"
4. Verify filtering works correctly

**Expected Results**:
- ✅ Search returns relevant results
- ✅ Filters work independently
- ✅ Combined search + filter works
- ✅ "No results" state handles gracefully

**API Validation**:
```bash
# Search clubs
curl "http://localhost:3000/api/clubs?search=tennis&limit=10"

# Filter by sport
curl "http://localhost:3000/api/clubs?sport=badminton"

# Combined filters
curl "http://localhost:3000/api/clubs?sport=tennis&search=downtown"
```

### 3.3 Join Public Club

**Test Case**: Join an open club

**Steps**:
1. Find a public club user is not member of
2. Click "Join Club" button
3. Verify immediate membership

**Expected Results**:
- ✅ Join request processes immediately
- ✅ Button changes to "Member" status
- ✅ User appears in club member list
- ✅ Club appears in user's clubs

**Requirements Check**:
- User skill level within club range
- Club has available capacity
- User not already a member

### 3.4 Join Private Club

**Test Case**: Join club requiring invite code

**Steps**:
1. Find private club (🔒 indicator)
2. Click "Request to Join"
3. Enter valid invite code when prompted
4. Verify membership granted

**Expected Results**:
- ✅ Invite code prompt appears
- ✅ Valid code grants membership
- ✅ Invalid code shows error message

**Test Invite Codes** (check console logs after seeding):
- Private clubs auto-generate codes
- Format: random alphanumeric string

### 3.5 View Club Details

**Test Case**: Access detailed club information

**Steps**:
1. Click "View Details" on any club
2. Examine all club information
3. Test member interactions (if member)

**Expected Information**:
- ✅ Complete club description
- ✅ Full member list with roles
- ✅ Club settings and rules
- ✅ Upcoming events
- ✅ Club statistics and history

---

## 4. Club Creation & Management

### 4.1 Create New Club

**Test Case**: Create a club from scratch

**Steps**:
1. Click "Create Club" button
2. Fill comprehensive form:
   ```
   Name: Test Tennis Academy
   Sport: tennis
   Description: Professional tennis training
   Location Name: Test Courts
   Address: 123 Test Street, Test City
   Privacy: Public
   Max Members: 50
   Skill Range: 4-9
   ```
3. Submit form

**Expected Results**:
- ✅ Club created successfully
- ✅ Creator becomes owner/admin
- ✅ Club appears in browse list
- ✅ All settings applied correctly

**API Validation**:
```bash
curl -X POST http://localhost:3000/api/clubs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Tennis Academy",
    "sport": "tennis",
    "description": "Professional tennis training",
    "location": {
      "name": "Test Courts", 
      "address": "123 Test Street, Test City"
    },
    "isPrivate": false,
    "settings": {
      "maxMembers": 50,
      "minSkillLevel": 4,
      "maxSkillLevel": 9
    }
  }'
```

### 4.2 Club Management Functions

**Test Case**: Manage club as owner/admin

**Prerequisites**: Be owner/admin of a club

**Management Tasks**:

**Edit Club Information**:
1. Access club management panel
2. Update description, settings, location
3. Save changes

**Member Management**:
1. View member list
2. Change member roles (member → organizer)
3. Remove inactive members

**Club Settings**:
1. Adjust skill level requirements
2. Change privacy settings
3. Update member capacity

**Expected Results**:
- ✅ All changes save immediately
- ✅ Permission checks work correctly
- ✅ Members see updated information

---

## 5. Event Participation

### 5.1 Browse Available Events

**Test Case**: View events from joined clubs

**Steps**:
1. Navigate to events page
2. View upcoming events
3. Filter by club or status

**Expected Information**:
- ✅ Event title and description
- ✅ Date, time, and duration
- ✅ Location and court information
- ✅ Skill level requirements
- ✅ Current RSVP count
- ✅ Registration fee (if any)

**Visual Indicators**:
- Event status (published, ongoing, completed)
- RSVP deadline
- Available spots remaining
- User's current RSVP status

### 5.2 RSVP to Event

**Test Case**: Join an upcoming event

**Steps**:
1. Find suitable event (skill level match)
2. Click "RSVP" or "Join Event"
3. Fill RSVP form:
   ```
   Status: Attending
   Skill Level: 7
   Preferred Format: doubles
   Partner Preference: (optional)
   Notes: Looking forward to playing!
   ```
4. Submit RSVP

**Expected Results**:
- ✅ RSVP recorded successfully
- ✅ Event shows user as attending
- ✅ User receives confirmation
- ✅ Attending count increments

**API Validation**:
```bash
curl -X POST http://localhost:3000/api/events/EVENT_ID/rsvp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "attending",
    "skillLevel": 7,
    "preferredFormat": "doubles",
    "notes": "Looking forward to playing!"
  }'
```

### 5.3 Modify RSVP

**Test Case**: Change event participation

**Steps**:
1. Access event with existing RSVP
2. Change status to "Maybe" or "Declined"
3. Update skill level or notes
4. Save changes

**Expected Results**:
- ✅ RSVP updates successfully
- ✅ Event statistics update
- ✅ Match generation adjusts accordingly

### 5.4 Cancel RSVP

**Test Case**: Remove event participation

**Steps**:
1. Find event with confirmed RSVP
2. Click "Cancel RSVP"
3. Confirm cancellation

**Expected Results**:
- ✅ RSVP removed completely
- ✅ Spot becomes available for others
- ✅ User no longer in attendee list

---

## 6. Match Generation & Scoring

### 6.1 Event Organizer Functions

**Test Case**: Manage event as organizer

**Prerequisites**: Be organizer/admin of club with events

**Steps**:
1. Access event management
2. Review current RSVPs
3. Generate matches when ready

**Event Lifecycle**:
- Draft → Published → Ongoing → Completed
- Only published events accept RSVPs
- Matches generated during ongoing phase

### 6.2 Generate Matches

**Test Case**: Auto-create balanced matches

**Prerequisites**: Event with 4+ attending players (doubles) or 2+ (singles)

**Steps**:
1. Access event as organizer
2. Click "Generate Matches"
3. Review created match pairings
4. Verify court assignments

**Expected Results**:
- ✅ Matches created based on skill levels
- ✅ Balanced team compositions
- ✅ Court assignments distributed
- ✅ Match schedule generated

**Algorithm Verification**:
- **Doubles**: Strongest + weakest vs middle players
- **Singles**: Adjacent skill level pairings
- **Court Rotation**: Even distribution across available courts

**API Validation**:
```bash
curl -X POST http://localhost:3000/api/events/EVENT_ID/generate-matches \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6.3 Record Match Scores

**Test Case**: Track game results

**Prerequisites**: Generated matches in progress

**Steps**:
1. Access match as player or organizer
2. Open score entry form
3. Enter match results:
   ```
   Team 1 Score: 6
   Team 2 Score: 4
   Sets: [
     {team1: 6, team2: 4},
     {team1: 6, team2: 2}
   ]
   ```
4. Submit score

**Expected Results**:
- ✅ Score recorded accurately
- ✅ Winner determined automatically
- ✅ Match status updated to "completed"
- ✅ Player statistics updated

**Permission Testing**:
- Players in match can enter scores
- Event organizers can enter any score
- Non-participants cannot modify scores

### 6.4 View Match History

**Test Case**: Review completed matches

**Steps**:
1. Navigate to completed events
2. View match results
3. Check player statistics

**Expected Information**:
- ✅ Final scores and winners
- ✅ Match duration and court
- ✅ Player performance history
- ✅ Club/event statistics

---

## 7. Role-Based Permissions

### 7.1 Member Permissions

**Test User**: Regular club member

**Allowed Actions**:
- ✅ View club information
- ✅ RSVP to events
- ✅ Record scores for own matches
- ✅ Leave club
- ✅ Update own profile

**Restricted Actions**:
- ❌ Edit club settings
- ❌ Create events
- ❌ Manage other members
- ❌ Delete club
- ❌ Generate matches

### 7.2 Organizer Permissions

**Test User**: Club organizer

**Additional Permissions**:
- ✅ Create and edit events
- ✅ Generate matches
- ✅ Manage regular members
- ✅ View member contact info
- ✅ Update event status

**Still Restricted**:
- ❌ Remove other organizers
- ❌ Delete club
- ❌ Assign admin roles

### 7.3 Admin Permissions  

**Test User**: Club admin

**Full Permissions**:
- ✅ All organizer permissions
- ✅ Assign any role (except owner)
- ✅ Remove any member
- ✅ Edit club settings
- ✅ Manage club privacy

**Owner-Only Restrictions**:
- ❌ Delete club
- ❌ Transfer ownership

### 7.4 Owner Permissions

**Test User**: Club owner

**Ultimate Permissions**:
- ✅ All possible club actions
- ✅ Delete club
- ✅ Transfer ownership
- ✅ Override any restriction

**Testing Permission Boundaries**:
```bash
# Test as different users
# Member trying to create event (should fail)
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer MEMBER_TOKEN" \
  -d '{...event_data...}'

# Expected: 403 Forbidden

# Organizer creating event (should succeed)  
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer ORGANIZER_TOKEN" \
  -d '{...event_data...}'

# Expected: 201 Created
```

---

## 8. API Testing Examples

### 8.1 Authentication Endpoints

**Register New User**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "password123",
    "skillLevel": 5
  }'
```

**Login User**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Get User Profile**:
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 8.2 Club Management Endpoints

**List All Clubs**:
```bash
curl -X GET "http://localhost:3000/api/clubs?page=1&limit=10"
```

**Get Specific Club**:
```bash
curl -X GET http://localhost:3000/api/clubs/CLUB_ID
```

**Create Club**:
```bash
curl -X POST http://localhost:3000/api/clubs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test Club",
    "sport": "tennis",
    "location": {
      "name": "Test Location",
      "address": "123 Test St"
    }
  }'
```

**Join Club**:
```bash
curl -X POST http://localhost:3000/api/clubs/CLUB_ID/join \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 8.3 Event Management Endpoints

**List Events**:
```bash
curl -X GET "http://localhost:3000/api/events?upcoming=true&club=CLUB_ID"
```

**Create Event**:
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer ORGANIZER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Tennis Match",
    "club": "CLUB_ID",
    "dateTime": "2024-12-25T14:00:00Z",
    "duration": 120,
    "format": "doubles",
    "maxParticipants": 8,
    "rsvpDeadline": "2024-12-24T12:00:00Z",
    "location": {
      "name": "Test Courts",
      "address": "123 Test St",
      "courts": [
        {"name": "Court 1", "isAvailable": true}
      ]
    }
  }'
```

**RSVP to Event**:
```bash
curl -X POST http://localhost:3000/api/events/EVENT_ID/rsvp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "attending",
    "skillLevel": 7
  }'
```

---

## 9. Edge Cases & Error Handling

### 9.1 Authentication Edge Cases

**Invalid Credentials**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "wrong@example.com",
    "password": "wrongpassword"
  }'
```
**Expected**: 401 Unauthorized

**Expired Token**:
- Wait for token expiry (24 hours) or modify JWT secret
- Try accessing protected endpoints
- **Expected**: 401 Token Invalid

**Missing Authorization Header**:
```bash
curl -X GET http://localhost:3000/api/auth/me
```
**Expected**: 401 Access Denied

### 9.2 Club Joining Edge Cases

**Already a Member**:
```bash
# Join same club twice
curl -X POST http://localhost:3000/api/clubs/CLUB_ID/join \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
**Expected**: 400 Already a member

**Club at Capacity**:
- Join club until maxMembers reached
- Try adding one more member
- **Expected**: 400 Club full

**Skill Level Mismatch**:
- User skill level 2, club requires 5-10
- **Expected**: 400 Skill level outside range

**Private Club Without Code**:
```bash
curl -X POST http://localhost:3000/api/clubs/PRIVATE_CLUB_ID/join \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{}'
```
**Expected**: 400 Invite code required

### 9.3 Event RSVP Edge Cases

**RSVP After Deadline**:
- Set system time after rsvpDeadline
- Try to RSVP
- **Expected**: 400 RSVP closed

**Event at Capacity**:
- Fill event to maxParticipants
- Try adding another RSVP
- **Expected**: 400 Event full

**Skill Level Restrictions**:
- User skill 3, event requires 6-10
- **Expected**: 400 Skill level outside range

**RSVP to Started Event**:
- Event dateTime in past
- **Expected**: 400 Event already started

### 9.4 Permission Edge Cases

**Non-Member Accessing Club Event**:
```bash
curl -X POST http://localhost:3000/api/events/EVENT_ID/rsvp \
  -H "Authorization: Bearer NON_MEMBER_TOKEN"
```
**Expected**: 403 Not a club member

**Member Creating Event**:
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer MEMBER_TOKEN" \
  -d '{...event_data...}'
```
**Expected**: 403 Organizer permissions required

**Organizer Deleting Club**:
```bash
curl -X DELETE http://localhost:3000/api/clubs/CLUB_ID \
  -H "Authorization: Bearer ORGANIZER_TOKEN"
```
**Expected**: 403 Only owner can delete

### 9.5 Data Validation Edge Cases

**Invalid Email Format**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -d '{"email": "notanemail", ...}'
```
**Expected**: 400 Invalid email

**Password Too Short**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -d '{"password": "123", ...}'
```
**Expected**: 400 Password too short

**Invalid Skill Level**:
```bash
curl -X POST http://localhost:3000/api/events/EVENT_ID/rsvp \
  -d '{"skillLevel": 15, ...}'
```
**Expected**: 400 Skill level must be 1-10

**Future Date Validation**:
```bash
curl -X POST http://localhost:3000/api/events \
  -d '{"dateTime": "2020-01-01T10:00:00Z", ...}'
```
**Expected**: 400 Event date must be in future

---

## 10. Performance Testing

### 10.1 Load Testing Scenarios

**Concurrent User Registration**:
```bash
# Simulate 10 simultaneous registrations
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{
      \"firstName\": \"User$i\",
      \"lastName\": \"Test\",
      \"email\": \"user$i@test.com\",
      \"password\": \"password123\"
    }" &
done
wait
```

**Bulk Club Joining**:
```bash
# Multiple users joining same club
for token in "${USER_TOKENS[@]}"; do
  curl -X POST http://localhost:3000/api/clubs/CLUB_ID/join \
    -H "Authorization: Bearer $token" &
done
wait
```

**Event RSVP Rush**:
```bash
# Simulate event filling up quickly
for token in "${USER_TOKENS[@]}"; do
  curl -X POST http://localhost:3000/api/events/EVENT_ID/rsvp \
    -H "Authorization: Bearer $token" \
    -d '{"status": "attending", "skillLevel": 5}' &
done
wait
```

### 10.2 Response Time Benchmarks

**Expected Response Times**:
- User registration: < 500ms
- Login: < 300ms
- Club listing: < 400ms
- Event creation: < 600ms
- Match generation: < 1000ms

**Testing with curl timing**:
```bash
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/clubs
```

Create `curl-format.txt`:
```
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
```

### 10.3 Database Performance

**Connection Pool Testing**:
- Monitor MongoDB connection count
- Test with high concurrent load
- Verify no connection leaks

**Query Performance**:
- Club search with text indexes
- Event filtering with date ranges
- User lookup with email index

**Memory Usage**:
- Monitor server memory consumption
- Test with large event generations
- Verify garbage collection

---

## ✅ Testing Checklist

### Pre-Testing Setup
- [ ] MongoDB running and accessible
- [ ] Backend server started (port 3000)
- [ ] Frontend application running (port 4200)
- [ ] Database seeded with test data
- [ ] All environment variables configured

### User Journey Testing
- [ ] New user registration works
- [ ] User login/logout functions
- [ ] Profile management complete
- [ ] Club browsing and search
- [ ] Public club joining
- [ ] Private club joining with codes
- [ ] Club creation and management
- [ ] Event browsing and filtering
- [ ] Event RSVP process
- [ ] Match generation algorithm
- [ ] Score recording and tracking

### Permission Testing
- [ ] Member permissions enforced
- [ ] Organizer role restrictions
- [ ] Admin privileges working
- [ ] Owner-only functions protected
- [ ] Cross-club permission isolation

### API Testing
- [ ] All endpoints respond correctly
- [ ] Authentication headers required
- [ ] Input validation working
- [ ] Error responses formatted properly
- [ ] Rate limiting (if implemented)

### Edge Cases
- [ ] Invalid input handling
- [ ] Permission boundary testing
- [ ] Capacity limit enforcement
- [ ] Deadline respect
- [ ] Skill level validation

### Performance
- [ ] Response times within limits
- [ ] Concurrent user handling
- [ ] Database query optimization
- [ ] Memory usage reasonable
- [ ] No resource leaks

---

## 🔧 Troubleshooting Guide

### Common Issues

**"Cannot connect to database"**:
- Check MongoDB service status
- Verify connection string in .env
- Ensure port 27017 available

**"Token expired" errors**:
- JWT tokens expire after 24 hours
- Re-login to get fresh token
- Check JWT_SECRET environment variable

**"Permission denied" responses**:
- Verify user role in club
- Check if user is club member
- Ensure proper authorization header

**Frontend shows empty data**:
- Check browser console for errors
- Verify API endpoints in environment.ts
- Confirm backend server running

**Matches not generating**:
- Ensure minimum players met (2 for singles, 4 for doubles)
- Check event status is "published" 
- Verify courts available in location

### Debug Commands

**Check server logs**:
```bash
# Backend logs show in terminal
cd backend && npm run dev
```

**Verify JWT token**:
```bash
# Decode token at jwt.io
echo "YOUR_JWT_TOKEN" | base64 -d
```

**MongoDB connection**:
```bash
# Connect to database directly
mongo playsquad
db.users.count()
db.clubs.count()
db.events.count()
```

**Network issues**:
```bash
# Test API connectivity
curl -I http://localhost:3000/api/clubs
curl -I http://localhost:4200
```

---

*This comprehensive testing guide ensures the PlaySquad application works flawlessly from user registration through match completion. Follow each section systematically to verify all functionality.*