import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ProtectedRoute } from './ProtectedRoute'
import { AppLayout } from '../components/layout/AppLayout'
import { StatusPage } from '../pages/misc/StatusPage'

import Login from '../pages/auth/Login'
import ResetPassword from '../pages/auth/ResetPassword'
import StudentDashboard from '../pages/student/StudentDashboard'
import AdminDashboard from '../pages/admin/AdminDashboard'
import LibrarianDashboard from '../pages/librarian/LibrarianDashboard'
import LibraryCatalog from '../pages/catalog/LibraryCatalog'
import BookDetails from '../pages/books/BookDetails'
import Circulation from '../pages/circulation/Circulation'
import Reservations from '../pages/reservations/Reservations'
import DueDates from '../pages/due-dates/DueDates'
import Fines from '../pages/fines/Fines'
import LostDamaged from '../pages/lost-damaged/LostDamaged'
import Reports from '../pages/reports/Reports'
import StudentManagement from '../pages/students/StudentManagement'
import Notifications from '../pages/notifications/Notifications'
import StudentProfile from '../pages/profile/StudentProfile'

const ROLE_HOME = {
  Student: '/student/dashboard',
  Admin: '/admin/dashboard',
  Librarian: '/librarian/dashboard',
}

function RootRedirect() {
  const { isAuthenticated, role, initializing } = useAuth()
  if (initializing) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={ROLE_HOME[role] || '/login'} replace />
}

/** Wraps a page needing the shared sidebar+topbar shell used by the 9 new pages. */
function Shell({ children, search, actions }) {
  return (
    <AppLayout search={search} actions={actions}>
      {children}
    </AppLayout>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route path="/" element={<RootRedirect />} />

      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute roles={['Student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute roles={['Admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/librarian/dashboard"
        element={
          <ProtectedRoute roles={['Librarian', 'Admin']}>
            <LibrarianDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/library"
        element={
          <ProtectedRoute roles={['Student', 'Admin', 'Librarian']}>
            <LibraryCatalog />
          </ProtectedRoute>
        }
      />

      <Route
        path="/books/:bookId"
        element={
          <ProtectedRoute roles={['Student', 'Admin', 'Librarian']}>
            <Shell><BookDetails /></Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/circulation"
        element={
          <ProtectedRoute roles={['Admin', 'Librarian']}>
            <Shell><Circulation /></Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reservations"
        element={
          <ProtectedRoute roles={['Student', 'Admin', 'Librarian']}>
            <Shell><Reservations /></Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/due-dates"
        element={
          <ProtectedRoute roles={['Student', 'Admin', 'Librarian']}>
            <Shell><DueDates /></Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/fines"
        element={
          <ProtectedRoute roles={['Student', 'Admin', 'Librarian']}>
            <Shell><Fines /></Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/lost-damaged"
        element={
          <ProtectedRoute roles={['Admin', 'Librarian']}>
            <Shell><LostDamaged /></Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute roles={['Admin', 'Librarian']}>
            <Shell><Reports /></Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/students"
        element={
          <ProtectedRoute roles={['Admin', 'Librarian']}>
            <Shell><StudentManagement /></Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute roles={['Student', 'Admin', 'Librarian']}>
            <Shell><Notifications /></Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute roles={['Student']}>
            <Shell><StudentProfile /></Shell>
          </ProtectedRoute>
        }
      />

      <Route path="/403" element={<StatusPage code="403" title="Access denied" message="You don't have permission to view this page." />} />
      <Route path="*" element={<StatusPage code="404" title="Page not found" message="The page you're looking for doesn't exist." />} />
    </Routes>
  )
}
