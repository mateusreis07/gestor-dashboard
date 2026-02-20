import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { RootRedirect } from './pages/RootRedirect';
import { Welcome } from './pages/Welcome';
import { Setup } from './pages/Setup';
import { LoginPage } from './pages/LoginPage';
import { ManagerHub } from './pages/ManagerHub';
import { ManagerOverview } from './pages/ManagerOverview';
import { TeamDashboard } from './pages/TeamDashboard';
import './App.css';

import { ImportConfiguration } from './pages/ImportConfiguration';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/login/:role" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route path="/app/overview" element={
            <ProtectedRoute>
              <ManagerOverview />
            </ProtectedRoute>
          } />
          <Route path="/app/manager" element={
            <ProtectedRoute>
              <ManagerHub />
            </ProtectedRoute>
          } />
          <Route path="/app/team/:teamId" element={
            <ProtectedRoute>
              <TeamDashboard />
            </ProtectedRoute>
          } />
          <Route path="/app/team/:teamId/import" element={
            <ProtectedRoute>
              <ImportConfiguration />
            </ProtectedRoute>
          } />
          <Route path="/app/dashboard" element={
            <ProtectedRoute>
              <TeamDashboard />
            </ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
