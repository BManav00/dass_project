dass_project/
├── backend/          # Node.js/Express API
├── frontend/         # React/Vite UI
└── README.md

# Event Management System (MERN Stack)

## Overview
A full-featured event management platform for academic and club events, built with MongoDB, Express.js, React, and Node.js. Supports admin, organizer, and participant roles, dynamic event forms, ticketing, merchandise, teams, chat, and feedback.

---

## Project Structure
```
dass_project/
├── backend/    # Node.js/Express API
├── frontend/   # React/Vite UI
├── README.md
├── COMPLETE_USER_GUIDE.md
```

---

## Technology Stack
- **MongoDB** – Database
- **Express.js** – Backend REST API
- **React** – Frontend (Vite)
- **Node.js** – Runtime

---

## Features
- User authentication (IIIT email validation, JWT, bcrypt)
- Role-based access: Admin, Organizer, Participant
- Admin dashboard: create/delete organizers, view stats
- Organizer dashboard: create/edit/publish events, manage participants
- Dynamic event form builder (custom questions, field types)
- Event registration and ticketing (unique IDs, QR codes)
- Capacity management and duplicate registration prevention
- Merchandise events (stock, price, buy now, out-of-stock handling)
- Team events (team creation/join, invite codes, auto-registration)
- Dashboards for all roles (tabs, analytics, ticket cards)
- Real-time chat (event forums, team chat)
- Anonymous feedback (ratings, comments)
- Email notifications (simulated)

---

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- MongoDB Atlas account (or local MongoDB)

### 1. Backend Setup
```bash
cd backend
npm install
# Create .env with MONGODB_URI
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Access the App
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:5000](http://localhost:5000)

---

## Default Credentials
**Admin:**
- Email: `admin@iiit.ac.in`
- Password: `Admin@IIIT2026`

---

## Testing
- Run backend: `npm start` in `backend/`
- Run frontend: `npm run dev` in `frontend/`
- Run tests: `python3 test_module4.py` (if present)

---

## Troubleshooting
- **Cannot connect to backend:** Ensure backend is running and `.env` is set up.
- **MongoDB connection failed:** Check `MONGODB_URI` in `.env` and MongoDB Atlas status.
- **Port already in use:** Kill processes on 5000/5173 (`sudo lsof -t -i:5000 | xargs kill -9`)
- **npm: command not found:** Install Node.js and npm.
- **Login issues:** Use default admin credentials, check backend logs.

---

## License
MIT (or specify your license)

---

## More Info
See `COMPLETE_USER_GUIDE.md` for a detailed walkthrough, feature explanations, and expected outputs for every module.
