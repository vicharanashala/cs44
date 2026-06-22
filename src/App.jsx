import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from './hooks/useAuth'

import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'

import HomePage from './pages/HomePage'
import QuestionDetailPage from './pages/QuestionDetailPage'
import AskQuestionPage from './pages/AskQuestionPage'
import SearchPage from './pages/SearchPage'
import FaqPage from './pages/FaqPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ProfilePage from './pages/ProfilePage'
import AdminDashboard from './pages/AdminDashboard'
import ModerationQueue from './pages/ModerationQueue'
import NotFoundPage from './pages/NotFoundPage'

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const location = useLocation()

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/question/:id" element={<QuestionDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/faq/:id" element={<FaqPage />} />

          <Route path="/ask" element={
            <ProtectedRoute>
              <AskQuestionPage />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin/moderation" element={
            <ProtectedRoute requireAdmin>
              <ModerationQueue />
            </ProtectedRoute>
          } />

          <Route path="/login" element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          } />
          <Route path="/signup" element={
            <GuestRoute>
              <SignupPage />
            </GuestRoute>
          } />
          <Route path="/forgot-password" element={
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          } />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  )
}
