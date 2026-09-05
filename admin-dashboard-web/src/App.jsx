import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import DashboardLayout from './components/DashboardLayout';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';
import TransactionsPage from './pages/TransactionsPage';
import ReportsPage from './pages/ReportsPage';
import LogsPage from './pages/LogsPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }) {
  const { admin, loading } = useAdminAuth();

  if (loading) return <div className="loading-text">Loading...</div>;
  if (!admin) return <Navigate to="/login" replace />;

  return children;
}

export default function App() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/users" element={<UsersPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/users" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  );
}
