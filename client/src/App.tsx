import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { CheckText } from './pages/CheckText';
import { History } from './pages/History';
import { ReportView } from './pages/ReportView';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AllActivity } from './pages/admin/AllActivity';
import { UsersManagement } from './pages/admin/UsersManagement';
import { DetectorControl } from './pages/admin/DetectorControl';
import { AuditLog } from './pages/admin/AuditLog';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* User Protected Routes */}
            <Route
              path="/check"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CheckText />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <Layout>
                    <History />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/report/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ReportView />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/activity"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AllActivity />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <UsersManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/detectors"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <DetectorControl />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AuditLog />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/check" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
