import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "react-hot-toast";

// Components
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import PatientLayout from './components/patient/PatientLayout.jsx';

// Staff Pages
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
import AIAssistant from './pages/AIAssistant.jsx';
import Billing from './pages/Billing.jsx';
import LabDiagnostics from './pages/LabDiagnostics.jsx';

// Patient Portal Pages
import PatientLogin from './pages/patient/PatientLogin.jsx';
import PatientRegister from './pages/patient/PatientRegister.jsx';
import PatientDashboard from './pages/patient/PatientDashboard.jsx';
import PatientHealthTimeline from './pages/patient/PatientHealthTimeline.jsx';
import PatientAppointments from './pages/patient/PatientAppointments.jsx';
import PatientPrescriptions from './pages/patient/PatientPrescriptions.jsx';
import PatientVitals from './pages/patient/PatientVitals.jsx';
import PatientSymptomDiary from './pages/patient/PatientSymptomDiary.jsx';
import PatientDocumentVault from './pages/patient/PatientDocumentVault.jsx';
import PatientAdmissionStatus from './pages/patient/PatientAdmissionStatus.jsx';
import PatientFeedback from './pages/patient/PatientFeedback.jsx';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Staff & Patient Auth Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/patient/login" element={<PatientLogin />} />
        <Route path="/patient/register" element={<PatientRegister />} />

        {/* ── STAFF ROUTES ── */}
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

        <Route
          path="/ai-assistant"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST']}>
              <Layout>
                <AIAssistant />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/billing"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'PHARMACIST']}>
              <Layout>
                <Billing />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/lab-diagnostics"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']}>
              <Layout>
                <LabDiagnostics />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* ── PATIENT PORTAL ROUTES ── */}
        <Route
          path="/patient/dashboard"
          element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <PatientLayout>
                <PatientDashboard />
              </PatientLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/timeline"
          element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <PatientLayout>
                <PatientHealthTimeline />
              </PatientLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/appointments"
          element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <PatientLayout>
                <PatientAppointments />
              </PatientLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/prescriptions"
          element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <PatientLayout>
                <PatientPrescriptions />
              </PatientLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/vitals"
          element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <PatientLayout>
                <PatientVitals />
              </PatientLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/symptoms"
          element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <PatientLayout>
                <PatientSymptomDiary />
              </PatientLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/documents"
          element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <PatientLayout>
                <PatientDocumentVault />
              </PatientLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/admission"
          element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <PatientLayout>
                <PatientAdmissionStatus />
              </PatientLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/feedback"
          element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <PatientLayout>
                <PatientFeedback />
              </PatientLayout>
            </ProtectedRoute>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;
