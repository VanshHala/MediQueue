import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Navbar from '../components/Navbar';

// Pages
import Landing from '../pages/public/Landing';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import LiveDisplay from '../pages/public/LiveDisplay';
import BloodRequestsBoard from '../pages/public/BloodRequestsBoard';
import FindDonors from '../pages/public/FindDonors';
import AccessRestricted from '../pages/public/AccessRestricted';
import SystemStates from '../pages/public/SystemStates';

// Dashboards & Patient Features
import PatientDashboard from '../pages/patient/PatientDashboard';
import BookAppointment from '../pages/patient/BookAppointment';
import MyAppointments from '../pages/patient/MyAppointments';
import PatientDonorProfile from '../pages/patient/PatientDonorProfile';
import DoctorConsole from '../pages/doctor/DoctorConsole';
import ReceptionDashboard from '../pages/reception/ReceptionDashboard';
import AdminDashboard from '../pages/admin/AdminDashboard';

export const AppRoutes = () => {
  const location = useLocation();

  // Hide standard Navbar on full-screen TV live display
  const isLiveDisplay = location.pathname === '/live-display';

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] font-sans text-slate-800">
      {!isLiveDisplay && <Navbar />}

      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/live-display" element={<LiveDisplay />} />
          <Route path="/blood-requests" element={<BloodRequestsBoard />} />
          <Route path="/find-donors" element={<FindDonors />} />
          <Route path="/restricted" element={<AccessRestricted />} />
          <Route path="/states" element={<SystemStates />} />

          {/* Patient Protected Routes */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/book"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <BookAppointment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-appointments"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <MyAppointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['patient', 'doctor', 'receptionist', 'admin']}>
                <PatientDonorProfile />
              </ProtectedRoute>
            }
          />

          {/* Doctor Routes */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorConsole />
              </ProtectedRoute>
            }
          />

          {/* Receptionist Routes */}
          <Route
            path="/reception"
            element={
              <ProtectedRoute allowedRoles={['receptionist', 'admin']}>
                <ReceptionDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default AppRoutes;
