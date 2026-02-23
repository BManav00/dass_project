import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import OrganizerScan from './pages/OrganizerScan';
import CreateEvent from './pages/CreateEvent';
import BrowseEvents from './pages/BrowseEvents';
import EventDetails from './pages/EventDetails';
import Profile from './pages/Profile';
import Clubs from './pages/Clubs';
import OrganizerView from './pages/OrganizerView';
import OrganizerEventDetail from './pages/OrganizerEventDetail';
import Onboarding from './pages/Onboarding';
import PrivateRoute from './components/PrivateRoute';
import RoleRoute from './components/RoleRoute';
import { isAuthenticated, getUser } from './utils/auth';

// Smart redirect based on user role
const SmartDashboardRedirect = () => {
  const user = getUser();

  if (user?.role === 'Admin') {
    return <Navigate to="/admin" replace />;
  } else if (user?.role === 'Organizer') {
    return <Navigate to="/organizer" replace />;
  } else {
    return <Navigate to="/dashboard" replace />;
  }
};

import Navbar from './components/Navbar/Navbar';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={isAuthenticated() ? <SmartDashboardRedirect /> : <Login />}
        />
        <Route
          path="/signup"
          element={isAuthenticated() ? <SmartDashboardRedirect /> : <Signup />}
        />

        {/* Role-based Protected Routes */}
        <Route
          path="/admin"
          element={
            <RoleRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/organizer"
          element={
            <RoleRoute allowedRoles={['Organizer']}>
              <OrganizerDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/organizer/scan"
          element={
            <RoleRoute allowedRoles={['Organizer']}>
              <OrganizerScan />
            </RoleRoute>
          }
        />

        <Route
          path="/organizer/ongoing"
          element={
            <RoleRoute allowedRoles={['Organizer']}>
              <OrganizerDashboard ongoingOnly={true} />
            </RoleRoute>
          }
        />

        <Route
          path="/organizer/dashboard"
          element={
            <RoleRoute allowedRoles={['Organizer']}>
              <OrganizerDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/organizer/create-event"
          element={
            <RoleRoute allowedRoles={['Organizer']}>
              <CreateEvent />
            </RoleRoute>
          }
        />

        <Route
          path="/organizer/edit-event/:id"
          element={
            <RoleRoute allowedRoles={['Organizer']}>
              <CreateEvent />
            </RoleRoute>
          }
        />

        <Route
          path="/organizer/events/:id"
          element={
            <RoleRoute allowedRoles={['Organizer']}>
              <OrganizerEventDetail />
            </RoleRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <RoleRoute allowedRoles={['Participant']}>
              <Dashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        <Route
          path="/onboarding"
          element={
            <RoleRoute allowedRoles={['Participant']}>
              <Onboarding />
            </RoleRoute>
          }
        />

        <Route
          path="/clubs"
          element={
            <PrivateRoute>
              <Clubs />
            </PrivateRoute>
          }
        />

        <Route
          path="/clubs/:id"
          element={
            <PrivateRoute>
              <OrganizerView />
            </PrivateRoute>
          }
        />

        {/* Browse Events - accessible to all authenticated users */}
        <Route
          path="/events"
          element={
            <PrivateRoute>
              <BrowseEvents />
            </PrivateRoute>
          }
        />

        {/* Event Details - accessible to all authenticated users */}
        <Route
          path="/events/:id"
          element={
            <PrivateRoute>
              <EventDetails />
            </PrivateRoute>
          }
        />

        {/* My Registrations - redirect to dashboard (tickets shown there) */}
        <Route
          path="/my-registrations"
          element={<Navigate to="/dashboard" replace />}
        />

        {/* Catch all - redirect based on auth status */}
        <Route
          path="*"
          element={
            isAuthenticated() ? <SmartDashboardRedirect /> : <Navigate to="/" replace />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
