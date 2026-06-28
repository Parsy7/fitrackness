import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LoadingPage } from './components/ui/index'
import { Layout } from './components/layout/Layout'

// User pages
import Login         from './pages/Login'
import Home          from './pages/user/Home'
import Sessions      from './pages/user/Sessions'
import SessionDetail from './pages/user/SessionDetail'
import NewSession    from './pages/user/NewSession'
import ActiveSession from './pages/user/ActiveSession'
import Stats         from './pages/user/Stats'
import Profile       from './pages/user/Profile'

// Admin pages
import Admin           from './pages/admin/Admin'
import AdminExercises  from './pages/admin/AdminExercises'
import AdminBlocks     from './pages/admin/AdminBlocks'
import AdminImport     from './pages/admin/AdminImport'
import AdminUsers      from './pages/admin/AdminUsers'
import AdminUserDetail from './pages/admin/AdminUserDetail'

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
      {/* Pública */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

      {/* Usuario */}
      <Route path="/"               element={<PrivateRoute><Layout><Home /></Layout></PrivateRoute>} />
      <Route path="/sessions"       element={<PrivateRoute><Layout><Sessions /></Layout></PrivateRoute>} />
      <Route path="/session/new"    element={<PrivateRoute><Layout><NewSession /></Layout></PrivateRoute>} />
      <Route path="/session/active" element={<PrivateRoute><ActiveSession /></PrivateRoute>} />
      <Route path="/session/:id"    element={<PrivateRoute><Layout><SessionDetail /></Layout></PrivateRoute>} />
      <Route path="/stats"          element={<PrivateRoute><Layout><Stats /></Layout></PrivateRoute>} />
      <Route path="/profile"        element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />

      {/* Admin */}
      <Route path="/admin"                element={<PrivateRoute adminOnly><Layout><Admin /></Layout></PrivateRoute>} />
      <Route path="/admin/exercises"      element={<PrivateRoute adminOnly><Layout><AdminExercises /></Layout></PrivateRoute>} />
      <Route path="/admin/blocks"         element={<PrivateRoute adminOnly><Layout><AdminBlocks /></Layout></PrivateRoute>} />
      <Route path="/admin/import"         element={<PrivateRoute adminOnly><Layout><AdminImport /></Layout></PrivateRoute>} />
      <Route path="/admin/users"          element={<PrivateRoute adminOnly><Layout><AdminUsers /></Layout></PrivateRoute>} />
      <Route path="/admin/users/:id"      element={<PrivateRoute adminOnly><Layout><AdminUserDetail /></Layout></PrivateRoute>} />

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
