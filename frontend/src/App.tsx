import React, { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserRole } from './types';

// Layout
import AppLayout from './components/layout/AppLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AthleteListPage from './pages/AthleteListPage';
import PerformancePage from './pages/PerformancePage';
import FeeManagementPage from './pages/FeeManagementPage';
import RegisterPage from './pages/RegisterPage';

// Lazy-loaded pages
const ForgotPasswordPage  = React.lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage   = React.lazy(() => import('./pages/ResetPasswordPage'));
const AthleteProfilePage  = React.lazy(() => import('./pages/AthleteProfilePage'));
const MyProfilePage       = React.lazy(() => import('./pages/MyProfilePage'));
const MyFeesPage          = React.lazy(() => import('./pages/MyFeesPage'));
const AddEditAthletePage  = React.lazy(() => import('./pages/AddEditAthletePage'));
const AdminPage           = React.lazy(() => import('./pages/AdminPage'));
const NotFoundPage        = React.lazy(() => import('./pages/NotFoundPage'));
const EventsPage          = React.lazy(() => import('./pages/EventsPage'));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="loading-screen" style={{ height: '100vh' }}>
    <div className="spinner" />
  </div>
);

// ─── Route Guards ─────────────────────────────────────────────────────────────

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[];
}

/**
 * Blocks unauthenticated users → /login
 * Blocks wrong-role users → role-based home
 */
const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const { user, loading, isAthlete } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role as UserRole)) {
    // Athlete gets sent to their profile, others to dashboard
    return <Navigate to={isAthlete ? '/profile' : '/dashboard'} replace />;
  }
  return <>{children}</>;
};

/**
 * Logged-in users skip public pages.
 * After login, Athlete → /profile, Coach/Admin → /dashboard.
 */
const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading, isAthlete } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <>{children}</>;
  return <Navigate to={isAthlete ? '/profile' : '/dashboard'} replace />;
};

/**
 * Root redirect after auth — role-aware.
 * Athlete → /profile, others → /dashboard.
 */
const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/dashboard" replace />;
};

// ─── Routes ───────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <React.Suspense fallback={<Spinner />}>
      <Routes>
        {/* Public */}
        <Route path="/login"                    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register"                 element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/forgot-password"          element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/reset-password/:token"    element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

        {/* Protected */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>

          {/* Root → role-based home */}
          <Route index element={<RoleRedirect />} />

          {/* Dashboard — all roles */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Athlete list — Coach & Admin only; Athlete hitting this gets bounced to /profile */}
          <Route
            path="athletes"
            element={
              <ProtectedRoute roles={[UserRole.Admin, UserRole.Coach]}>
                <AthleteListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="athletes/add"
            element={
              <ProtectedRoute roles={[UserRole.Admin, UserRole.Coach]}>
                <AddEditAthletePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="athletes/:id"
            element={
              <ProtectedRoute roles={[UserRole.Admin, UserRole.Coach]}>
                <AthleteProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="athletes/:id/edit"
            element={
              <ProtectedRoute roles={[UserRole.Admin, UserRole.Coach]}>
                <AddEditAthletePage />
              </ProtectedRoute>
            }
          />

          {/* Athlete's own profile — Athlete-only route */}
          <Route path="profile" element={<ProtectedRoute roles={[UserRole.Athlete]}><MyProfilePage /></ProtectedRoute>} />
          <Route path="my-fees" element={<ProtectedRoute roles={[UserRole.Athlete]}><MyFeesPage /></ProtectedRoute>} />

          {/* Shared routes */}
          <Route path="fees" element={<ProtectedRoute roles={[UserRole.Admin, UserRole.Coach]}><FeeManagementPage /></ProtectedRoute>} />
          <Route path="performance" element={<ProtectedRoute roles={[UserRole.Admin, UserRole.Coach]}><PerformancePage /></ProtectedRoute>} />
          <Route path="events" element={<ProtectedRoute roles={[UserRole.Admin, UserRole.Coach]}><EventsPage /></ProtectedRoute>} />

          {/* Admin only */}
          <Route
            path="admin"
            element={
              <ProtectedRoute roles={[UserRole.Admin]}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </React.Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </AuthProvider>
    </BrowserRouter>
  );
}
