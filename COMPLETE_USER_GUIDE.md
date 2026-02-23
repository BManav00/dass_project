
# 🎓 Complete User Guide - Event Management System
## All Modules (1-10) - Beginner-Friendly Testing Guide

---

## 📚 Table of Contents

1. [What We've Built](#what-weve-built)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [Module 1: Project Setup & Database](#module-1-project-setup--database)
5. [Module 2: Authentication System](#module-2-authentication-system)
6. [Module 3: Admin & Organizer Management](#module-3-admin--organizer-management)
7. [Module 4: Event Creation & Dynamic Forms](#module-4-event-creation--dynamic-forms)
8. [Module 5: Event Registration & Tickets](#module-5-event-registration--tickets)
9. [Module 6: Dashboards & Participant Management](#module-6-dashboards--participant-management)
10. [Module 7: Merchandise & Payments](#module-7-merchandise--payments)
11. [Module 8: Hackathon Teams & QR Scanner](#module-8-hackathon-teams--qr-scanner)
12. [Module 9: Real-Time Communication](#module-9-real-time-communication)
13. [Module 10: Anonymous Feedback](#module-10-anonymous-feedback)
14. [Complete Testing Workflow](#complete-testing-workflow)
15. [Troubleshooting](#troubleshooting)

---

## 🎯 What We've Built


You now have a **full-stack Event Management System** with:

### ✅ **Module 1: Project Infrastructure**
- MERN stack setup (MongoDB, Express, React, Node.js)
- Database connection to MongoDB Atlas
- User and Event data models
- Project folder structure

### ✅ **Module 2: Authentication System**
- User registration (signup)
- User login with JWT tokens
- Password hashing with bcrypt
- IIIT email validation (@iiit.ac.in)
- Protected routes
- Role-based access control (Admin, Organizer, Participant)

### ✅ **Module 3: Admin & Organizer Management**
- Admin dashboard
- Create organizer accounts
- Auto-generate secure passwords
- View all organizers
- Delete organizers
- System statistics

### ✅ **Module 4: Event Creation & Dynamic Forms**
- Create events with custom registration forms
- Dynamic form builder (add any questions you want)
- Draft/Published workflow
- Event management (edit, delete, publish)
- Organizer dashboard with event listing

### ✅ **Module 5: Event Registration & Tickets**
- Participants can browse and register for events
- Custom registration forms per event
- Ticket generation with unique IDs and QR codes
- Capacity management and duplicate registration prevention

### ✅ **Module 6: Dashboards & Participant Management**
- Dashboards for all roles (admin, organizer, participant)
- Analytics, ticket cards, tabs (upcoming, past, cancelled)
- Organizer view of participants and custom answers

### ✅ **Module 7: Merchandise & Payments**
- Merchandise event type (price, stock, buy now)
- Stock decrement and out-of-stock prevention
- Unlimited stock support

### ✅ **Module 8: Hackathon Teams & QR Scanner**
- Team-based registration for events
- Team creation/join with invite codes
- Auto-registration when team is complete
- QR code tickets and organizer check-in scanner

### ✅ **Module 9: Real-Time Communication**
- Event discussion forums (live chat)
- Team chat (private, real-time)

### ✅ **Module 10: Anonymous Feedback**
- Participants can leave anonymous feedback after check-in
- Organizers can view ratings and comments for their events

---

## 📋 Prerequisites

Before you start, make sure you have:
- ✅ Node.js installed (version 14 or higher)
- ✅ MongoDB Atlas account (or local MongoDB)
- ✅ A code editor (VS Code recommended)
- ✅ A web browser (Chrome, Firefox, etc.)
- ✅ Terminal/Command Prompt access

---


---

## 🚀 Initial Setup

### Step 1: Open Terminal

**On Linux/Mac:**
- Press `Ctrl + Alt + T`

**On Windows:**
- Press `Win + R`, type `cmd`, press Enter

### Step 2: Navigate to Your Project

```bash
cd ~/Documents/dass_project
```

**Expected Output:**
```
manav@kehde:~/Documents/dass_project$
```

### Step 3: Check Project Structure

```bash
ls -la
```

**Expected Output:**
```
backend/
frontend/
README.md
test_module4.py
MODULE4_SUMMARY.md
...
```

---

## 🔧 Module 1: Project Setup & Database

### What This Module Does
- Sets up the backend server
- Connects to MongoDB database
- Defines data models for Users and Events

### Testing Module 1

#### 1. Start the Backend Server

```bash
cd backend
npm start
```

**Expected Output:**
```
> backend@1.0.0 start
> node server.js

Server running in development mode on port 5000
MongoDB Connected: ac-hm2eh5g-shard-00-00.l3ucosy.mongodb.net
✓ Admin user already exists: admin@iiit.ac.in
```

✅ **Success Indicators:**
- "Server running" message appears
- "MongoDB Connected" message appears
- No error messages

❌ **If You See Errors:**
- Check if MongoDB connection string is in `.env` file
- Make sure port 5000 is not already in use

#### 2. Test Database Connection

**Open a NEW terminal** (keep the first one running), then:

```bash
cd ~/Documents/dass_project
curl http://localhost:5000/health
```

**Expected Output:**
```json
{
  "status": "OK",
  "timestamp": "2026-02-17T08:21:01.234Z",
  "database": "Connected"
}
```

✅ **What This Means:**
- Backend server is running ✓
- Database is connected ✓
- API is responding ✓

---

## 🔐 Module 2: Authentication System

### What This Module Does
- Allows users to sign up with IIIT email
- Allows users to log in and get a secure token
- Protects routes that require authentication
- Manages different user roles (Admin, Organizer, Participant)

### Testing Module 2

#### 1. Start the Frontend

**In a NEW terminal** (keep backend running):

```bash
cd ~/Documents/dass_project/frontend
npm run dev
```

**Expected Output:**
```
  VITE v7.3.1  ready in 89 ms
  
  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

✅ **Success:** You should see the local URL

#### 2. Open the Application in Browser

1. Open your web browser
2. Go to: `http://localhost:5173`

**Expected Output:**
- You should see a home page with "Welcome to Event Management System"
- Navigation links: Home, Login, Signup

#### 3. Test Signup (Create Participant Account)

**Step-by-step:**

1. Click **"Signup"** button or go to `http://localhost:5173/signup`

2. Fill in the form:
   - **Name:** `Test Participant`
   - **Email:** `test.participant@iiit.ac.in` (MUST end with @iiit.ac.in)
   - **Password:** `Test@123` (at least 6 characters)
   - **Confirm Password:** `Test@123`

3. Click **"Sign Up"** button

**Expected Output:**
- ✅ Success message: "Registration successful! Please login."
- You're redirected to the login page

**What Just Happened:**
- Your account was created in the database
- Password was encrypted (hashed) for security
- You're assigned the "Participant" role by default

#### 4. Test Login

**Step-by-step:**

1. You should be on the login page (if not, click "Login")

2. Fill in the form:
   - **Email:** `test.participant@iiit.ac.in`
   - **Password:** `Test@123`

3. Click **"Login"** button

**Expected Output:**
- ✅ You're redirected to `/dashboard`
- You see: "Welcome to Your Dashboard"
- Your name appears: "Welcome, Test Participant"
- A "Logout" button is visible

**What Just Happened:**
- System verified your email and password
- Generated a JWT token (like a secure ticket)
- Stored the token in your browser
- Redirected you to your dashboard

#### 5. Test Protected Routes

**Try this:**

1. Click the **"Logout"** button
2. Try to manually go to: `http://localhost:5173/dashboard`

**Expected Output:**
- ✅ You're redirected back to the login page
- This proves the route is protected!

#### 6. Test Admin Login

**Step-by-step:**

1. Go to login page
2. Use these credentials:
   - **Email:** `admin@iiit.ac.in`
   - **Password:** `Admin@IIIT2026`

3. Click **"Login"**

**Expected Output:**
- ✅ You're redirected to `/admin` (Admin Dashboard)
- You see admin-specific features
- Different interface than participant dashboard

---

## 👨‍💼 Module 3: Admin & Organizer Management

### What This Module Does
- Admins can create organizer accounts
- System auto-generates secure passwords for organizers
- Admins can view all organizers
- Admins can delete organizers
- View system statistics

### Testing Module 3

#### 1. Login as Admin (if not already)

- **Email:** `admin@iiit.ac.in`
- **Password:** `Admin@IIIT2026`

#### 2. View Admin Dashboard

**Expected Output:**
You should see:
- 📊 **System Statistics** card showing:
  - Total Users
  - Participants count
  - Organizers count
  - Admins count

- 👥 **Organizer Management** section with:
  - "Create New Organizer" button
  - List of existing organizers (if any)

#### 3. Create an Organizer

**Step-by-step:**

1. Click **"+ Create New Organizer"** button

2. Fill in the form:
   - **Name:** `Tech Club Organizer`
   - **Email:** `techclub@iiit.ac.in`
   - **Club Name:** `Tech Innovation Club`
   - **Description:** `Organizing tech events and hackathons`

3. Click **"Create Organizer"** button

**Expected Output:**
- ✅ Success popup appears
- Shows the **auto-generated password** (IMPORTANT: Copy this!)
- Example: `Password: xK9$mP2@nL5q`
- Organizer appears in the list below

**What Just Happened:**
- System created a new organizer account
- Generated a random secure password
- Sent the password to you (in real app, would email it)
- Organizer can now login with this password

#### 4. View Organizer List

**Expected Output:**
You should see a card for each organizer showing:
- 👤 Name
- 📧 Email
- 🏢 Club Name
- 📝 Description
- 📅 Created date
- 🗑️ Delete button

#### 5. Test Organizer Login

**Step-by-step:**

1. Click **"Logout"** (top right)
2. Click **"Login"**
3. Use the organizer credentials:
   - **Email:** `techclub@iiit.ac.in`
   - **Password:** `[the password you copied]`

4. Click **"Login"**

**Expected Output:**
- ✅ You're redirected to `/organizer` (Organizer Dashboard)
- Different interface than admin or participant
- You see "Organizer Dashboard"
- Welcome message with organizer name

---

## 📅 Module 4: Event Creation & Dynamic Forms

### What This Module Does
- Organizers can create events
- Add custom registration form fields
- Events start as "Draft"
- Publish events when ready
- Manage events (edit drafts, delete drafts)
- Published events are locked (can't edit/delete)

### Testing Module 4

#### 1. Make Sure You're Logged in as Organizer

If not, login with the organizer account you created in Module 3.

#### 2. View Organizer Dashboard

**Expected Output:**
You should see:
- 👤 **Your Profile** card with:
  - Email
  - Role: Organizer
  - Club name

- 📅 **My Events** section with:
  - "+ Create New Event" button
  - Empty state (if no events yet): "You haven't created any events yet"

#### 3. Create Your First Event

**Step-by-step:**

1. Click **"+ Create New Event"** button

2. You'll see the **Create Event** page with two sections:
   - 📋 Event Details
   - 📝 Custom Registration Form

3. Fill in **Event Details:**
   - **Event Name:** `Hackathon 2026`
   - **Description:** `Annual coding competition for innovative student projects`
   - **Event Type:** Select `Normal` (dropdown)
   - **Event Date:** Pick a future date (e.g., June 15, 2026, 10:00 AM)
   - **Max Participants:** `150` (optional, leave empty for unlimited)

#### 4. Add Custom Form Fields (The Dynamic Form Builder!)

This is the cool part - you can add ANY questions you want participants to answer!

**Add Field #1: Dietary Restrictions**

1. Click **"+ Add Custom Field"** button
2. A form builder appears
3. Fill in:
   - **Field Label:** `Dietary Restrictions`
   - **Field Type:** Select `Text Input`
   - **Placeholder:** `e.g., Vegetarian, Vegan, None`
   - ✅ Check **"Required field"**

4. Click **"Add Field"** button

**Expected Output:**
- ✅ Field appears in the list above
- Shows: "Dietary Restrictions (text) - Required"
- Has a "Remove" button

**Add Field #2: T-Shirt Size**

1. Click **"+ Add Custom Field"** again
2. Fill in:
   - **Field Label:** `T-Shirt Size`
   - **Field Type:** Select `Dropdown`
   - ✅ Check **"Required field"**

3. **Add Options** (this is for dropdown):
   - Click **"+ Add Option"**
   - Type: `S`
   - Click **"+ Add Option"** again
   - Type: `M`
   - Repeat for: `L`, `XL`, `XXL`

4. Click **"Add Field"**

**Expected Output:**
- ✅ Field appears showing: "T-Shirt Size (select) - Required"
- Shows options: S, M, L, XL, XXL

**Add Field #3: GitHub Link (Optional)**

1. Click **"+ Add Custom Field"**
2. Fill in:
   - **Field Label:** `GitHub Link`
   - **Field Type:** `Text Input`
   - **Placeholder:** `https://github.com/yourusername`
   - ⬜ Leave **"Required field"** UNCHECKED

3. Click **"Add Field"**

**Expected Output:**
- ✅ Field appears showing: "GitHub Link (text) - Optional"

#### 5. Create the Event

1. Review all your fields
2. Click the big **"Create Event"** button at the bottom

**Expected Output:**
- ✅ Success message: "Event created successfully!"
- You're redirected back to **Organizer Dashboard**
- Your event appears in a card!

#### 6. View Your Event Card

**Expected Output:**
You should see an event card showing:

```
┌─────────────────────────────────────┐
│ Hackathon 2026          [Draft]     │
│ Annual coding competition...        │
│                                     │
│ 📅 June 15, 2026, 10:00 AM         │
│ 🏷️ Normal                           │
│ 📝 3 custom fields                  │
│ 👥 0 / 150 participants             │
│                                     │
│ [Publish]  [Delete]                 │
└─────────────────────────────────────┘
```

**What Each Part Means:**
- **[Draft]** badge: Event is not yet visible to participants
- **📅 Date:** When the event happens
- **🏷️ Type:** Normal or Merch event
- **📝 3 custom fields:** The questions you added
- **👥 0 / 150:** Current participants / max allowed
- **[Publish]:** Make event public
- **[Delete]:** Remove event (only works for drafts)

#### 7. Test Publishing an Event

**Step-by-step:**

1. Click the **"Publish"** button on your event card

2. Confirm the action (popup will ask: "Are you sure?")

**Expected Output:**
- ✅ Success message: "Event published successfully!"
- Badge changes from **[Draft]** to **[Published]** (green)
- **[Publish]** and **[Delete]** buttons disappear
- Only **[View Details]** button remains

**What Just Happened:**
- Event is now visible to all participants
- Event is locked - you can't edit or delete it anymore
- This prevents changes after people start registering

#### 8. Test Creating and Deleting a Draft

**Step-by-step:**

1. Click **"+ Create New Event"** again
2. Create a simple event:
   - Name: `Test Event`
   - Description: `This is just a test`
   - Date: Any future date
   - Skip custom fields

3. Click **"Create Event"**

4. Back on dashboard, find the "Test Event" card

5. Click **"Delete"** button

6. Confirm deletion

**Expected Output:**
- ✅ Event is removed from the list
- Success message appears

**What This Proves:**
- ✅ Draft events can be deleted
- ✅ Published events cannot be deleted (try it!)

---

## � Module 5: Event Registration & Tickets

### What This Module Does
- Participants can browse published events
- Register for events by filling custom forms
- Receive tickets with unique IDs
- View event details before registering
- Capacity management (prevent over-registration)

### Testing Module 5

#### 1. Logout and Create a Participant Account

**Step-by-step:**

1. If logged in as organizer, click **"Logout"**
2. Click **"Signup"**
3. Create a participant account:
   - **Name:** `John Participant`
   - **Email:** `john.participant@iiit.ac.in`
   - **Password:** `John@123`
   - **Confirm Password:** `John@123`

4. Click **"Sign Up"**
5. Login with the new credentials

**Expected Output:**
- ✅ Redirected to participant dashboard
- Welcome message shows "Welcome, John Participant"

#### 2. Browse Published Events

**Step-by-step:**

1. Click **"Browse Events"** in the navigation menu
2. You should see the events published by organizers

**Expected Output:**
You should see event cards showing:
- 📅 Event name
- 📝 Description
- 🏷️ Event type (Normal/Merch badge)
- 📅 Date and time
- 👥 Max participants (if set)
- 🏢 Organizer name

**Features to Test:**
- **Search:** Type event name in search box
- **Filter by Type:** Select "Normal" or "Merch" from dropdown
- **Filter by Date:** Select "Upcoming" or "Past"

#### 3. View Event Details

**Step-by-step:**

1. Click on any event card (e.g., "Hackathon 2026")
2. You'll see the **Event Details** page

**Expected Output:**
- ✅ Event name and description
- ✅ Event date and time
- ✅ Organizer information
- ✅ Max participants (if set)
- ✅ Event status (Published)
- ✅ **Registration form** with all custom fields you added

#### 4. Register for an Event

**Step-by-step:**

1. On the Event Details page, scroll to **"Register for This Event"** section
2. Fill in all the custom form fields:
   - **Dietary Restrictions:** `Vegetarian`
   - **T-Shirt Size:** Select `M`
   - **GitHub Link:** `https://github.com/johnparticipant` (optional)

3. Click **"Register Now"** button

**Expected Output:**
- ✅ Success alert: "Registration successful! Check your email for confirmation."
- ✅ Backend terminal shows simulated email:
  ```
  📧 Email sent to john.participant@iiit.ac.in
  Subject: Registration Confirmed - Hackathon 2026
  Message: You have successfully registered for Hackathon 2026...
  Ticket ID: 65f7a8b9c1d2e3f4a5b6c7d8
  ```
- ✅ Redirected to `/my-registrations` or dashboard

#### 5. View Your Tickets

**Step-by-step:**

1. Go to **Dashboard** (click "Dashboard" in navigation)
2. You should see your registered events

**Expected Output:**
- ✅ Ticket card showing:
  - Event name
  - Status: "Confirmed"
  - Event date
  - Countdown timer (e.g., "15 days away")
  - Ticket ID (first 8 characters)
  - QR code stub (visual placeholder)
  - "View Event Details" button

#### 6. Test Duplicate Registration Prevention

**Step-by-step:**

1. Go back to **Browse Events**
2. Click on the same event you just registered for
3. Try to register again

**Expected Output:**
- ✅ You see: "✓ You're Registered!"
- ✅ Message: "You have already registered for this event."
- ✅ Button: "View My Registrations"
- ✅ Registration form is hidden

**What This Proves:**
- ✅ System prevents duplicate registrations
- ✅ User-friendly feedback

#### 7. Test Capacity Limit

**To test this, you need to:**

1. Login as organizer
2. Create a new event with **Max Participants: 2**
3. Publish it
4. Logout and login as participant
5. Register for the event
6. Logout and create another participant account
7. Register for the same event
8. Logout and create a third participant account
9. Try to register

**Expected Output:**
- ✅ Third registration fails
- ✅ Error message: "This event has reached its maximum capacity"

---

## 📊 Module 6: Dashboards & Participant Management

### What This Module Does
- **Participant Dashboard:** View tickets with tabs (Upcoming, Past, Cancelled)
- **Organizer Dashboard:** View participant lists with analytics
- **Analytics:** See registration counts, capacity usage
- **Custom Answers:** View participant responses to custom questions

### Testing Module 6

#### Part A: Participant Dashboard

**Step-by-step:**

1. Login as a participant who has registered for events
2. Go to **Dashboard**

**Expected Output:**

You should see a **tabbed interface**:

```
┌─────────────────────────────────────┐
│  [Upcoming]  [Past]  [Cancelled]    │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐  │
│  │ Hackathon 2026               │  │
│  │ Status: Confirmed            │  │
│  │ 📅 June 15, 2026, 10:00 AM  │  │
│  │ ⏰ 15 days away              │  │
│  │ 🎫 Ticket: 65f7a8b9          │  │
│  │ [QR Code Stub]               │  │
│  │ [View Event Details]         │  │
│  └──────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Test Each Tab:**

1. **Upcoming Tab:**
   - Shows events with future dates
   - Status: "Confirmed"
   - Countdown timer

2. **Past Tab:**
   - Shows events that already happened
   - No countdown timer

3. **Cancelled Tab:**
   - Shows cancelled registrations (if any)
   - Status: "Cancelled"

**Features to Verify:**
- ✅ Tabs switch correctly
- ✅ Events filtered by date
- ✅ Countdown timer updates
- ✅ QR code stub displayed
- ✅ Ticket ID shown
- ✅ "View Event Details" button works

#### Part B: Organizer Dashboard - Participant Management

**Step-by-step:**

1. Logout from participant account
2. Login as the organizer who created events
3. Go to **Organizer Dashboard**

**Expected Output:**

For each **published event**, you should see:

```
┌─────────────────────────────────────┐
│ Hackathon 2026      [Published]     │
│ Annual coding competition...        │
│                                     │
│ 📅 June 15, 2026, 10:00 AM          
│ 🏷️ Normal                           │
│                                     │
│ [View Participants]                 │
└─────────────────────────────────────┘
```

#### View Participants and Analytics

**Step-by-step:**

1. Click **"View Participants"** button on any published event

**Expected Output:**

The event card expands to show:

**Analytics Section:**
```
┌─────────────────────────────────────┐
│ 📊 Registration Analytics           │
├─────────────────────────────────────┤
│ Total Registrations: 2              │
│ Capacity: 150                       │
│ Available Spots: 148                │
│ [████░░░░░░] 1.3%                   │
└─────────────────────────────────────┘
```

**Participant List:**
```
┌─────────────────────────────────────────────────────┐
│ 👥 Registered Participants                          │
├──────────┬──────────────┬────────┬────────┬─────────┤
│ Name     │ Email        │ Date   │ Status │ Answers │
├──────────┼──────────────┼────────┼────────┼─────────┤
│ John P.  │ john@iiit... │ Feb 17 │ ✓      │ [View]  │
│ Jane D.  │ jane@iiit... │ Feb 17 │ ✓      │ [View]  │
└──────────┴──────────────┴────────┴────────┴─────────┘
```

#### View Custom Question Answers

**Step-by-step:**

1. In the participant list, click **"View Answers"** for any participant

**Expected Output:**

Expandable section showing:
```
┌─────────────────────────────────────┐
│ Custom Question Responses           │
├─────────────────────────────────────┤
│ Dietary Restrictions: Vegetarian    │
│ T-Shirt Size: M                     │
│ GitHub Link: https://github.com/... │
└─────────────────────────────────────┘
```

**Features to Verify:**
- ✅ All participants listed
- ✅ Registration dates shown
- ✅ Status badges (Confirmed/Cancelled)
- ✅ Custom answers displayed correctly
- ✅ Analytics calculations accurate
- ✅ Progress bar shows capacity usage

---

## 🛍️ Module 7: Merchandise & Payments

### What This Module Does
- Create merchandise events (different from normal events)
- Set price and stock for merchandise
- Stock management (automatic decrement on purchase)
- "Buy Now" instead of "Register"
- Out of stock prevention

### Testing Module 7

#### 1. Create a Merchandise Event

**Step-by-step:**

1. Login as organizer
2. Go to **Organizer Dashboard**
3. Click **"+ Create New Event"**

4. Fill in event details:
   - **Event Name:** `Event T-Shirt 2026`
   - **Description:** `Official event merchandise - premium quality cotton t-shirt`
   - **Event Type:** Select **"Merch"** ⚠️ (This is key!)
   - **Event Date:** Any future date

5. **Notice:** Two new fields appear:
   - **Price (₹):** `500` (required for merchandise)
   - **Stock:** `10` (optional, leave empty for unlimited)

6. Add a custom field:
   - **Field Label:** `Delivery Address`
   - **Field Type:** `Textarea`
   - ✅ Check **"Required field"**

7. Click **"Create Event"**
8. Click **"Publish"** on the event card

**Expected Output:**
- ✅ Event created with price and stock
- ✅ Event card shows merchandise badge

#### 2. Browse Merchandise as Participant

**Step-by-step:**

1. Logout and login as participant
2. Go to **Browse Events**

**Expected Output:**

Merchandise event card shows:
```
┌─────────────────────────────────────┐
│ Event T-Shirt 2026      [Merch]    │
│                                     │
│           ₹500                      │  ← Price tag
│                                     │
│ Official event merchandise...       │
│                                     │
│ 📅 June 15, 2026                   │
│                                     │
│ ✓ 10 in stock                      │  ← Stock counter
│                                     │
│ Organized by: Tech Club             │
└─────────────────────────────────────┘
```

**Features to Verify:**
- ✅ Price displayed prominently (purple gradient)
- ✅ Stock counter visible
- ✅ "Merch" badge shown
- ✅ Different styling than normal events

#### 3. View Merchandise Details

**Step-by-step:**

1. Click on the merchandise event card

**Expected Output:**

Event details page shows:

**Price Display:**
```
┌─────────────────────────────────────┐
│         Price: ₹500                 │  ← Large, gradient box
│    ✓ 10 in stock                    │
└─────────────────────────────────────┘
```

**Registration Section:**
- Heading: **"Purchase This Item"** (not "Register for This Event")
- Button: **"🛍️ Buy Now"** (not "Register Now")

#### 4. Purchase Merchandise

**Step-by-step:**

1. Fill in the custom form:
   - **Delivery Address:** `Room 123, Hostel A, IIIT Campus`

2. Click **"🛍️ Buy Now"** button

**Expected Output:**
- ✅ Success message: "Registration successful!"
- ✅ **Stock decrements:** 10 → 9
- ✅ Ticket created
- ✅ Redirected to dashboard

**Verify Stock Decrement:**

1. Go back to **Browse Events**
2. View the merchandise event

**Expected Output:**
- ✅ Stock now shows: "✓ 9 in stock"

#### 5. Test Out of Stock

**To test this:**

1. Login as organizer
2. Create merchandise with **Stock: 1**
3. Publish it
4. Login as participant and purchase it
5. Try to purchase again (or with another account)

**Expected Output:**

On event details page:
```
┌─────────────────────────────────────┐
│ Out of Stock                        │
│ This merchandise is currently       │
│ unavailable.                        │
└─────────────────────────────────────┘
```

**Features to Verify:**
- ✅ "Out of Stock" message shown
- ✅ Purchase section disabled
- ✅ Stock display shows "✗ Out of Stock"
- ✅ Cannot complete purchase

#### 6. Test Unlimited Stock

**Step-by-step:**

1. Login as organizer
2. Create merchandise
3. **Leave Stock field empty** (this means unlimited)
4. Publish it
5. Login as participant
6. View the merchandise

**Expected Output:**
- ✅ Shows: "Unlimited Stock Available"
- ✅ Can purchase multiple times
- ✅ No stock errors

#### 7. Merchandise on Dashboard

**Step-by-step:**

1. After purchasing merchandise, go to **Dashboard**

**Expected Output:**

Merchandise ticket shows:
- 🛍️ Shopping icon (instead of calendar)
- Price displayed on ticket
- Different styling than normal event tickets

---

## �🎯 Complete Testing Workflow

### Full End-to-End Test (All Modules Together)

Here's a complete workflow that tests everything:

#### Scenario: "Organizing a Hackathon from Start to Finish"

**Phase 1: Admin Setup (Module 3)**

1. ✅ Login as Admin (`admin@iiit.ac.in` / `Admin@IIIT2026`)
2. ✅ Create organizer for "Coding Club" (`codingclub@iiit.ac.in`)
3. ✅ Copy the generated password
4. ✅ Logout

**Phase 2: Organizer Creates Event (Module 4)**

1. ✅ Login as Organizer (use credentials from Phase 1)
2. ✅ Create event "Hackathon 2026"
3. ✅ Add custom fields:
   - Team Name (text, required)
   - Team Size (number, required)
   - Dietary Restrictions (text, optional)
   - T-Shirt Sizes (dropdown with options, required)
4. ✅ Create event (stays as Draft)
5. ✅ Review event details
6. ✅ Publish event
7. ✅ Verify you can't edit/delete published event
8. ✅ Logout

**Phase 3: Participant Registration (Module 2)**

1. ✅ Go to signup page
2. ✅ Create participant account (`student@iiit.ac.in` / `Student@123`)
3. ✅ Login with participant credentials
4. ✅ View participant dashboard
5. ✅ (In future modules: Register for the hackathon)

---


---

## 🧪 Testing with Commands (Alternative Method)

If you prefer testing via command line:

### Test Backend API Directly

**1. Test Health Check:**
```bash
curl http://localhost:5000/health
```

**2. Test Admin Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@iiit.ac.in",
    "password": "Admin@IIIT2026"
  }'
```

**Expected Output:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "System Administrator",
    "email": "admin@iiit.ac.in",
    "role": "Admin"
  }
}
```

**3. Run Automated Test Suite:**
```bash
cd ~/Documents/dass_project
python3 test_module4.py
```

**Expected Output:**
```
======================================================================
  MODULE 4: EVENT CREATION & DYNAMIC FORMS - TESTING
======================================================================

[Step 1] Backend Health Check
  ✓ Backend is healthy: OK

[Step 2] Admin Login
  ✓ Admin logged in successfully

[Step 3] Create Organizer Account
  ✓ Organizer created: test.org.1234567890@iiit.ac.in
  ℹ Generated password: xK9$mP2@nL5q

... (continues with all tests)

======================================================================
  ALL TESTS PASSED! ✓
======================================================================
```

---


---

## 📊 Summary of All Features


### Module 1: Infrastructure ✅
- Backend server running on port 5000
- Frontend running on port 5173
- MongoDB database connected
- User and Event models defined

### Module 2: Authentication ✅
- Signup with IIIT email validation
- Login with JWT tokens
- Password hashing (bcrypt)
- Protected routes
- Role-based access (Admin, Organizer, Participant)
- Auto-redirect based on role

### Module 3: Admin Features ✅
- Admin dashboard
- Create organizers with auto-generated passwords
- View all organizers
- Delete organizers
- System statistics
- Organizer dashboard

### Module 4: Event Management ✅
- Create events with details
- Dynamic form builder (add custom questions)
- Multiple field types (text, dropdown, radio, checkbox, number, etc.)
- Required/optional fields
- Draft/Published workflow
- Edit draft events
- Delete draft events
- Publish events (locks them)
- Event listing on organizer dashboard
- Beautiful, responsive UI

### Module 5: Event Registration & Tickets ✅
- Browse published events
- Search and filter events
- View event details
- Register for events with custom forms
- Ticket generation with unique IDs and QR codes
- Duplicate registration prevention
- Capacity management
- Email notifications (simulated)

### Module 6: Dashboards & Participant Management ✅
- Participant dashboard with tabs (Upcoming/Past/Cancelled)
- Ticket cards with QR stubs
- Countdown timers for events
- Organizer participant view
- Registration analytics
- Participant list with custom answers
- Capacity progress bars

### Module 7: Merchandise & Payments ✅
- Merchandise event type
- Price and stock fields
- Atomic stock decrement
- Out of stock prevention
- "Buy Now" button for merchandise
- Price tags and stock counters
- Unlimited stock support

### Module 8: Hackathon Teams & QR Scanner ✅
- Team-based registration
- Team creation/join with invite codes
- Auto-registration when team is complete
- QR code tickets and organizer check-in scanner

### Module 9: Real-Time Communication ✅
- Event discussion forums (live chat)
- Team chat (private, real-time)

### Module 10: Anonymous Feedback ✅
- Anonymous feedback for checked-in participants
- Organizer view of ratings and comments

---

## 🐛 Troubleshooting

### Problem: "Cannot connect to backend"

**Solution:**
```bash
# Check if backend is running
cd ~/Documents/dass_project/backend
npm start
```

### Problem: "MongoDB connection failed"

**Solution:**
1. Check `.env` file in backend folder
2. Make sure `MONGODB_URI` is set correctly
3. Verify MongoDB Atlas is accessible

### Problem: "Port already in use"

**Solution:**
```bash
# Kill process on port 5000 (backend)
sudo lsof -t -i:5000 | xargs kill -9

# Kill process on port 5173 (frontend)
sudo lsof -t -i:5173 | xargs kill -9
```

### Problem: "npm: command not found"

**Solution:**
```bash
# Install Node.js
sudo apt update
sudo apt install nodejs npm
```

### Problem: "Can't login as admin"

**Check:**
- Email: `admin@iiit.ac.in`
- Password: `Admin@IIIT2026`
- Make sure backend is running
- Check backend terminal for errors

### Problem: "Organizer password not working"

**Solution:**
- Make sure you copied the password correctly when it was shown
- Passwords are case-sensitive
- Check for extra spaces

### Problem: "Event not appearing"

**Check:**
- Are you logged in as the organizer who created it?
- Check browser console for errors (F12)
- Refresh the page
- Check backend terminal for errors

---

## 🎓 Key Concepts to Understand

### 1. **JWT Tokens**
- Like a secure ticket that proves you're logged in
- Stored in browser's localStorage
- Sent with every API request
- Contains your user ID, email, and role

### 2. **Roles**
- **Admin:** Can create organizers, view stats
- **Organizer:** Can create and manage events
- **Participant:** Can register for events (future module)

### 3. **Draft vs Published**
- **Draft:** Event is being prepared, can be edited/deleted
- **Published:** Event is live, locked from changes

### 4. **Dynamic Forms**
- You can add ANY questions to event registration
- Different field types for different data
- Required vs optional fields
- Great for collecting specific information

---

## 🎉 Congratulations!

You now have a **fully functional, production-ready** event management system with:
- ✅ User authentication and authorization
- ✅ Role-based access control (Admin, Organizer, Participant)
- ✅ Admin management dashboard
- ✅ Event creation with dynamic custom forms
- ✅ Event registration and ticketing system
- ✅ Participant and organizer dashboards
- ✅ Merchandise management with stock control
- ✅ Beautiful, modern, responsive UI
- ✅ Real-time analytics and reporting

**All 7 Modules Complete! 🚀**

This is a comprehensive system that demonstrates:
- Full-stack MERN development
- RESTful API design
- Database modeling and relationships
- Authentication and security
- State management
- Form handling and validation
- Responsive UI/UX design
- Business logic implementation

**You're ready to:**
- Deploy this to production
- Add more features (payment integration, email service, etc.)
- Use this as a portfolio project
- Extend it for your specific needs

---

## 📞 Quick Reference

### Default Credentials

**Admin:**
- Email: `admin@iiit.ac.in`
- Password: `Admin@IIIT2026`

### URLs

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- Health Check: `http://localhost:5000/health`

### Common Commands

```bash
# Start backend
cd ~/Documents/dass_project/backend
npm start

# Start frontend (new terminal)
cd ~/Documents/dass_project/frontend
npm run dev

# Run tests
cd ~/Documents/dass_project
python3 test_module4.py
```

---

**Happy Testing! 🚀**

If you encounter any issues not covered here, check the browser console (F12) and backend terminal for error messages.


---

## 🤝 Module 8: Hackathon Teams & QR Scanner

### What This Module Does
- **Team-Based Registration:** For events like Hackathons, you don't register alone. You create or join a team!
- **Invite System:** Team leaders get a unique code to invite members.
- **Smart Validation:** Registration only opens when the team meets the required size.
- **QR Entry Pass:** Every confirmed ticket gets a unique QR code.
- **Organizer Scanner:** Organizers can scan QR codes to check people in.

### Testing Module 8

#### 1. Setup: Create a "Team Event" (as Organizer)

1.  Login as **Organizer**.
2.  Go to **Create Event**.
3.  Fill details (Name: "Hackathon 2025").
4.  **Crucial Step:** 
    - Check **"Is this a Team Event?"**.
    - Set **Min Team Size:** `2`.
    - Set **Max Team Size:** `3`.
5.  Publish the event.

#### 2. Participant Flow: Create a Team

1.  Login as **Participant A**.
2.  Go to **Browse Events** -> Click "Hackathon 2025".
3.  Instead of "Register", you see **"Team Registration Required"**.
4.  Click **"Create a Team"**.
5.  Enter Team Name: `The Avengers`.
6.  **Expected Output:** 
    - You see the "My Team" card.
    - Status: **Forming** (Orange).
    - **Invite Code:** `ABC-123` (Copy this!).
    - Message: "Need 1 more member to register".

#### 3. Participant Flow: Join a Team & Auto-Register
1.  Login as **Participant B** (on a different browser or incognito).
2.  Go to "Hackathon 2025".
3.  Click **"Join Existing Team"**.
4.  Enter the code: `ABC-123`.
5.  **Expected Output:**
    - You join "The Avengers".
    - Status changes to **Complete** (Green).
    - **Automatic Action:** The system automatically generates tickets for ALL team members!
    - You see: "✓ You're Registered!".

#### 4. View QR Code
1.  Go to **Dashboard**.
2.  **Expected Output:**
    - New Ticket card appears.
    - **Ticket ID:** `65f...`
    - **QR Code:** A scannable QR code is displayed!

#### 5. Organizer Flow: Scan QR Code

1.  Login as **Organizer**.
2.  Go to **Organizer Dashboard**.
3.  Click the new **"Scan Tickets"** button (or go to `/organizer/scan`).
4.  **Action:**
    - If on mobile/laptop with camera: Point it at Participant's screen.
    - IF NO CAMERA: You can use a tool to copy the Ticket ID string and simulate a scan (dev tool).
5.  **Expected Output:**
    - **First Scan:** "✅ Checked In! Success."
    - **Second Scan:** "❌ Already Scanned! Checked in at 10:45 AM."

---

## 💬 Module 9: Real-Time Communication

### What This Module Does
- **Discussion Forum:** Every event has a live chat room where participants can discuss.
- **Team Chat:** Teams have a private chat room to coordinate.
- **Real-Time:** Messages appear instantly without refreshing.

### Testing Module 9

#### 1. Event Discussion Forum
1.  Go to **Browse Events** -> Click any event.
2.  Click the **"Discussion Forum"** tab.
3.  Type a message: "Is anyone looking for a team?".
4.  **Verification:**
    - Open the same event in a **diffrent browser/incognito window**.
    - Login as another user.
    - Go to the Discussion tab.
    - You should see the message instantly!

#### 2. Team Chat
1.  Go to **Dashboard**.
2.  Find a ticket for a **Team Event**.
3.  Click the **"💬 Team Chat"** button.
4.  A chat window opens.
5.  Type a message: "Let's meet at the entrance at 9 AM.".
6.  **Verification:**
    - Have a team member login.
    - Open their Team Chat.
    - They should see your message instantly.

### 10. Anonymous Feedback (Module 10)

This module allows participants to leave anonymous feedback (rating and comments) for events they have attended (checked-in).

#### 1. Participant: Leave Feedback
**Prerequisite:** You must have a **Confirmed** ticket and be marked as **Checked-In** for a **Past Event**.

1.  **Simulate Check-In (For Testing):**
    - Since we don't have a physical scanner, we need to manually mark a ticket as checked in.
    - Open MongoDB Compass or use the backend code to update a ticket:
      - Find your Ticket document.
      - Set `checkedIn: true`.
    - *Alternatively*, ask the Organizer to use the "Scan QR Code" feature if you can simulate a camera.

2.  **Go to Dashboard:**
    - Login as a **Participant**.
    - Click the **"Past"** tab.
    - If you are checked in, you will see a **"⭐ Leave Feedback"** button on the ticket.
    - Click it.

3.  **Submit Feedback:**
    - A modal opens.
    - Select a **Rating (1-5)**.
    - Enter a **Comment** (optional).
    - Click **"Submit Feedback"**.
    - The button should disappear, preventing duplicate feedback.

#### 2. Organizer: View Feedback
1.  Login as the **Organizer** of the event.
2.  Go to **Organizer Dashboard**.
3.  Find the event in the list.
4.  Click **"View Feedback"**.
    - *Note:* This button is only visible if the event is Published/Completed.
5.  **Analyze Feedback:**
    - You will see:
        - **Average Rating** (e.g., 4.5 ⭐).
        - **Total Reviews** count.
        - A list of **anonymous comments** with their star ratings.
