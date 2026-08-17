// src/App.jsx     ← correct – NO BrowserRouter here
import { Routes, Route, Navigate } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from './context/AuthContext'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Homepage from './pages/Homepage';
import BrowsePage from './pages/BrowsePage';
import Posts from './pages/Posts';
import ItineraryPlanning from './pages/ItineraryPlanning';
import CreateItinerary from './pages/CreateItinerary';
import Chat from './pages/ChatPage';
import SearchResults from './pages/SearchResults';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import AdminLogin from './pages/AdminLogin';
import UserProfilePage from './pages/UserProfilePage';
import CreatePostModal from './components/CreatePostModal';
import ViewTripPage from './pages/ViewTripPage';
import VerificationPage from './pages/VerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerifyResetOtpPage from './pages/VerifyResetOtpPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

import GoogleAuthSuccess from './pages/GoogleAuthSuccess';
import ReviewPage from './pages/ReviewPage';

function ProtectedRoute({ children }) {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { user } = useContext(AuthContext);
  return user ? <Navigate to={user.isAdmin ? '/admin' : '/homepage'} replace /> : children;
}

function AdminRoute({ children }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/homepage" replace />;
  return children;
}

function App() {
  return (
    <>
    <Routes>
      <Route path="/" element={<GuestRoute><Landing /></GuestRoute>} />
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
      <Route path="/@@123admin" element={<GuestRoute><AdminLogin /></GuestRoute>} />

      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-reset-otp" element={<VerifyResetOtpPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      {/* Google OAuth callback — must be public, not wrapped in GuestRoute */}
      <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />

      <Route path="/homepage" element={<ProtectedRoute><Homepage /></ProtectedRoute>} />
      <Route path="/browsepage" element={<ProtectedRoute><BrowsePage /></ProtectedRoute>} />
      <Route path="/posts" element={<ProtectedRoute><Posts /></ProtectedRoute>} />
      <Route path="/itineraryplanningpage" element={<ProtectedRoute><ItineraryPlanning /></ProtectedRoute>} />
      <Route path="/create-itinerary" element={<ProtectedRoute><CreateItinerary /></ProtectedRoute>} />
      <Route path="/edit-itinerary" element={<ProtectedRoute><CreateItinerary /></ProtectedRoute>} />
      <Route path="/chatpage" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><SearchResults /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/profile/:userId" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
      <Route path="/trip/:id" element={<ProtectedRoute><ViewTripPage /></ProtectedRoute>} />
      <Route path="/trip" element={<ProtectedRoute><ViewTripPage /></ProtectedRoute>} />
      <Route path="/verification" element={<ProtectedRoute><VerificationPage /></ProtectedRoute>} />
      <Route path="/review" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Navigate to="/profile" replace state={{ tab: 'web' }} /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <CreatePostModal />
    </>
  )
}

export default App