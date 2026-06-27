import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LoadingPage } from './components/ui/index'
import { Layout } from './components/layout/Layout'

// Pages
import Login      from './pages/Login'
import Home       from './pages/user/Home'
import Stats      from './pages/user/Stats'
import Profile    from './pages/user/Profile'
import NewSession from './pages/user/NewSession'
import Admin      from './pages/admin/Admin'

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingPage />
  if (!user)   return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingPage />
  if (user)    return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><Layout><Home /></Layout></PrivateRoute>} />
      <Route path="/session/new" element={<PrivateRoute><Layout><NewSession /></Layout></PrivateRoute>} />
      <Route path="/stats"   element={<PrivateRoute><Layout><Stats /></Layout></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
      <Route path="/admin"   element={<PrivateRoute adminOnly><Layout><Admin /></Layout></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
