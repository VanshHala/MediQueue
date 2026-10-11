import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import usePolling from '../../hooks/usePolling';
import StatusPill from '../../components/StatusPill';
import PriorityBadge from '../../components/PriorityBadge';
import { Skeleton } from '../../components/Skeleton';
import {
  Siren,
  UserPlus,
  Users,
  CheckCircle,
  XCircle,
  Stethoscope,
  Filter,
  Check,
  AlertTriangle,
  Clock,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const ReceptionDashboard = () => {
  const [mode, setMode] = useState('walkin'); // 'walkin' or 'emergency'
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [queueList, setQueueList] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(true);

  // Filter state for queue table
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Registration form state
  const [formData, setFormData] = useState({
    patient_name: '',
    age: '',
    phone: '',
    department_id: '',
    doctor_id: '',
    blood_group: 'O+'
  });
  const [submitting, setSubmitting] = useState(false);
  const [lastIssuedTicket, setLastIssuedTicket] = useState(null);

  // Load departments, doctors, and today's queue
  const fetchData = useCallback(async () => {
    try {
      const [depRes, docRes, queueRes] = await Promise.all([
        api.get('/departments'),
        api.get('/doctors'),
        api.get('/queue/today')
      ]);

      if (depRes.data.success) setDepartments(depRes.data.data);
      if (docRes.data.success) setDoctors(docRes.data.data);
      if (queueRes.data.success) setQueueList(queueRes.data.data);
    } catch (err) {
      console.error('Failed to load reception data:', err);
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling queue every 10 seconds
  usePolling(async () => {
    try {
      const queueRes = await api.get('/queue/today');
      if (queueRes.data.success) setQueueList(queueRes.data.data);
    } catch (err) {
      console.warn('Queue polling notice:', err);
    }
  }, 10000);

  // Filter doctors by selected department in the form
  const availableDoctors = formData.department_id
    ? doctors.filter((d) => d.department_id === Number(formData.department_id))
    : doctors;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Reset doctor if department changed
      ...(name === 'department_id' ? { doctor_id: '' } : {})
    }));
  };

  // Submit Walk-in or Emergency Registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.doctor_id || !formData.patient_name || !formData.age) {
      toast.error('Please complete all mandatory fields.');
      return;
    }

    try {
      setSubmitting(true);
      const endpoint = mode === 'emergency' ? '/appointments/emergency' : '/appointments/walkin';
      const res = await api.post(endpoint, formData);

      if (res.data.success) {
        toast.success(res.data.message || 'Token generated successfully!');
        setLastIssuedTicket(res.data.data);

        // Reset form
        setFormData({
          patient_name: '',
          age: '',
          phone: '',
          department_id: '',
          doctor_id: '',
          blood_group: 'O+'
        });

        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Check In appointment
  const handleCheckin = async (id) => {
    try {
      const res = await api.put(`/appointments/${id}/checkin`);
      if (res.data.success) {
        toast.success('Patient checked in! Now waiting in the queue.');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    }
  };

  // Cancel Token
  const handleCancel = async (id) => {
    const confirm = window.confirm('Cancel this token? Tokens are non-reusable and will stay recorded as cancelled.');
    if (!confirm) return;

    try {
      const res = await api.put(`/appointments/${id}/cancel`);
      if (res.data.success) {
        toast.success('Token cancelled. Marked as inactive and not reused.');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed');
    }
  };

  // Filtered queue table
  const filteredQueue = queueList.filter((appt) => {
    if (doctorFilter !== 'all' && appt.doctor_id !== Number(doctorFilter)) return false;
    if (statusFilter !== 'all' && appt.status !== statusFilter) return false;
    return true;
  });

  const isEmergencyMode = mode === 'emergency';
  const ageNum = parseInt(formData.age, 10);
  const isSenior = ageNum >= 60 && !isEmergencyMode;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      
      {/* 1. Header with Mode Switcher */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-700"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full">
              Hospital Reception & Triage Desk
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Walk-in & Emergency Registration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Rapid patient intake, atomic token allocation, and live queue dispatcher
          </p>
        </div>

        {/* Mode Switch (Walk-in vs Emergency) */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setMode('walkin');
              setLastIssuedTicket(null);
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition ${
              !isEmergencyMode
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Walk-in Patient
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('emergency');
              setLastIssuedTicket(null);
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition ${
              isEmergencyMode
                ? 'bg-rose-600 text-white shadow-2xs ring-2 ring-rose-500 ring-offset-1'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <Siren className="w-4 h-4" />
            Acute Emergency
          </button>
        </div>
      </div>

      {/* 2. Registration Intake Form */}
      <div className={`bg-white rounded-3xl border transition-all duration-200 shadow-sm overflow-hidden ${
        isEmergencyMode
          ? 'border-t-4 border-t-rose-600 border-rose-300 ring-1 ring-rose-200'
          : 'border-slate-200'
      }`}>
        
        {/* Banner */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${
          isEmergencyMode ? 'bg-rose-50/80 border-rose-200' : 'bg-slate-50/80 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {isEmergencyMode ? (
              <Siren className="w-5 h-5 text-rose-600 animate-bounce" />
            ) : (
              <UserPlus className="w-5 h-5 text-teal-700" />
            )}
            <h3 className={`text-sm font-extrabold uppercase tracking-wide ${
              isEmergencyMode ? 'text-rose-900' : 'text-slate-900'
            }`}>
              {isEmergencyMode ? 'Emergency Triage Admission (E-Series Token)' : 'General Walk-in Patient Registration'}
            </h3>
          </div>

          <span className="text-xs text-slate-500">
            {isEmergencyMode ? 'Top queue priority • 100 base points' : 'Auto-detects seniors >= 60'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          
          {/* Senior Auto-Detection Banner */}
          {isSenior && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                Senior Priority Notice: Age {formData.age} detected. Patient will be automatically issued an S-Series token with elevated 50 base points.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Patient Full Name *
              </label>
              <input
                type="text"
                name="patient_name"
                value={formData.patient_name}
                onChange={handleChange}
                placeholder="e.g. Bhavesh Dave"
                required
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Age *
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="e.g. 64"
                min="1"
                max="120"
                required
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Contact Phone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 9825012345"
                required
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Department *
              </label>
              <select
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="">-- Choose Department --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Attending Specialist *
              </label>
              <select
                name="doctor_id"
                value={formData.doctor_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="">-- Choose Doctor --</option>
                {availableDoctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.department_name} • Room {doc.room_no})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Blood Group
              </label>
              <select
                name="blood_group"
                value={formData.blood_group}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono font-bold"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500">
              Generated tokens immediately join today's active hall queue with CHECKED_IN status.
            </span>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white transition shadow-sm text-sm flex items-center justify-center gap-2 ${
                isEmergencyMode
                  ? 'bg-rose-600 hover:bg-rose-700 ring-2 ring-rose-600 ring-offset-2'
                  : 'bg-teal-700 hover:bg-teal-800'
              }`}
            >
              {isEmergencyMode ? (
                <>
                  <Siren className="w-4 h-4" />
                  {submitting ? 'Registering Emergency...' : 'Register Acute Emergency (E01)'}
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  {submitting ? 'Registering...' : 'Register Walk-in Patient'}
                </>
              )}
            </button>
          </div>

        </form>

        {/* Issued Ticket Callout Box */}
        {lastIssuedTicket && (
          <div className="mx-6 sm:mx-8 mb-6 p-5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-700 text-white flex flex-col items-center justify-center font-mono font-black text-xl shadow-sm">
                {lastIssuedTicket.token_no}
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                  New Token Issued
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  {lastIssuedTicket.patient_name_snapshot} ({lastIssuedTicket.category})
                </h4>
                <p className="text-xs text-slate-500">
                  Status: <strong>CHECKED_IN</strong> • All other patient waiting times updated live!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLastIssuedTicket(null)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Dismiss
            </button>
          </div>
        )}

      </div>

      {/* 3. Today's Full Queue Table Across Doctors */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        
        {/* Table Filters Bar */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-700" />
              <h3 className="text-base font-bold text-slate-900 uppercase">
                Today's Hospital Queue Monitor
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                {filteredQueue.length} Active Tickets
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live hospital-wide token tracker across all active OPD chambers
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Doctor Filter */}
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white"
            >
              <option value="all">All Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.department_name})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="BOOKED">Booked</option>
              <option value="SERVING">Now Serving</option>
              <option value="DONE">Done</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Tabular List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-5">Token</th>
                <th className="py-3 px-4">Patient Particulars</th>
                <th className="py-3 px-4">Specialist & Chamber</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Row Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loadingQueue ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-5"><Skeleton className="h-7 w-12 rounded-lg" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-32 mb-1" /><Skeleton className="h-3 w-20" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-28 mb-1" /><Skeleton className="h-3 w-16" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-5 w-24 rounded-full" /></td>
                    <td className="py-3.5 px-5 text-right"><Skeleton className="h-7 w-20 ml-auto rounded-lg" /></td>
                  </tr>
                ))
              ) : filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-xs text-slate-400">
                    No matching appointments found for today.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((appt) => {
                  const isCancelled = ['CANCELLED', 'NO_SHOW'].includes(appt.status);

                  return (
                    <tr key={appt.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-5 font-mono font-extrabold text-slate-900">
                        {appt.token_no}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 text-sm">{appt.patient_name_snapshot}</div>
                        <div className="text-xs text-slate-500">Age: {appt.age_snapshot}</div>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-semibold text-slate-800">{appt.doctor_name}</div>
                        <div className="text-slate-500 font-mono">Chamber {appt.room_no}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <PriorityBadge category={appt.category} skipCount={appt.skip_count} />
                      </td>

                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-600 uppercase">
                        {appt.source}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusPill status={appt.status} />
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {appt.status === 'BOOKED' && (
                            <button
                              type="button"
                              onClick={() => handleCheckin(appt.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200"
                            >
                              Check In
                            </button>
                          )}

                          {!isCancelled && appt.status !== 'DONE' && (
                            <button
                              type="button"
                              onClick={() => handleCancel(appt.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200"
                            >
                              Cancel Token
                            </button>
                          )}

                          {isCancelled && (
                            <span className="text-[11px] text-slate-400 italic">
                              not reused
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};

export default ReceptionDashboard;
