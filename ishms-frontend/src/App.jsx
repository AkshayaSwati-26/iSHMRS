import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "react-hot-toast";

// Components
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';

// Pages
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Patients from './pages/Patients.jsx';
import OPDQueue from './pages/OPDQueue.jsx';
import BedAvailability from './pages/BedAvailability.jsx';
import Inventory from './pages/Inventory.jsx';
import Alerts from './pages/Alerts.jsx';
import Reports from './pages/Reports.jsx';
import CityDashboard from './pages/CityDashboard.jsx';
import Appointments from './pages/Appointments.jsx';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST']}>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR']}>
              <Layout>
                <Appointments />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/patients"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR']}>
              <Layout>
                <Patients />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/opd"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST']}>
              <Layout>
                <OPDQueue />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/beds"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'NURSE', 'RECEPTIONIST']}>
              <Layout>
                <BedAvailability />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'PHARMACIST']}>
              <Layout>
                <Inventory />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/alerts"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <Layout>
                <Alerts />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/city-dashboard"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <Layout>
                <CityDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

