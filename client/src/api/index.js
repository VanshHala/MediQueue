import api from './axios';

// Departments & Doctors
export const getDepartments = () => api.get('/departments');
export const getDoctors = () => api.get('/doctors');
export const getDoctorSlots = (doctorId, date) =>
  api.get(`/doctors/${doctorId}/slots${date ? `?date=${date}` : ''}`);

// Appointments
export const bookAppointment = (data) => api.post('/appointments', data);
export const getMyAppointments = () => api.get('/appointments/mine');
export const getAppointmentEta = (id) => api.get(`/appointments/${id}/eta`);
export const checkInAppointment = (id) => api.put(`/appointments/${id}/checkin`);
export const cancelAppointment = (id) => api.put(`/appointments/${id}/cancel`);

// Receptionist & Intake
export const bookWalkIn = (data) => api.post('/appointments/walkin', data);
export const bookEmergency = (data) => api.post('/appointments/emergency', data);

// Queue endpoints
export const getDoctorQueue = () => api.get('/queue/doctor');
export const callNextPatient = () => api.post('/queue/call-next');
export const completeConsultation = (id) => api.put(`/queue/${id}/complete`);
export const markNoShow = (id) => api.put(`/queue/${id}/noshow`);
export const skipPatient = (id) => api.put(`/queue/${id}/skip`);
export const getTodayQueue = (params) => api.get('/queue/today', { params });
export const getDisplayQueue = () => api.get('/queue/display');

// Blood Donor Network
export const getDonorProfile = () => api.get('/blood/donor-profile');
export const updateDonorProfile = (data) => api.put('/blood/donor-profile', data);
export const createBloodRequest = (data) => api.post('/blood/requests', data);
export const getBloodRequests = (params) => api.get('/blood/requests', { params });
export const getBloodRequestById = (id) => api.get(`/blood/requests/${id}`);
export const getNearbyDonorsForRequest = (id) => api.get(`/blood/requests/${id}/donors`);
export const getAllDonors = (params) => api.get('/blood/donors', { params });
export const respondToBloodRequest = (id, data) => api.post(`/blood/requests/${id}/respond`, data);
export const fulfillBloodRequest = (id) => api.put(`/blood/requests/${id}/fulfill`);

// Admin & Analytics Telemetry
export const getAdminAnalytics = () => api.get('/admin/analytics');
export const getAdminReport = (date) => api.get(`/admin/report${date ? `?date=${date}` : ''}`);
export const getAdminUsers = (params) => api.get('/admin/users', { params });
export const updateAdminUserRole = (id, role) => api.patch(`/admin/users/${id}/role`, { role });
export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`);
export const getAdminDepartments = () => api.get('/admin/departments');
export const createAdminDepartment = (data) => api.post('/admin/departments', data);

export default api;
