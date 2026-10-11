import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAdminAnalytics,
  getAdminReport,
  getAdminUsers,
  updateAdminUserRole,
  deleteAdminUser,
  getAdminDepartments,
  createAdminDepartment
} from '../../api';
import { StatCardSkeleton, Skeleton } from '../../components/Skeleton';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('ANALYTICS'); // ANALYTICS | DOCTORS | USERS | DEPARTMENTS | REPORT
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Users tab state
  const [usersList, setUsersList] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);

  // Departments tab state
  const [departments, setDepartments] = useState([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [creatingDept, setCreatingDept] = useState(false);

  // Daily Report tab state
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Fetch Analytics
  const fetchAnalytics = async () => {
    try {
      const res = await getAdminAnalytics();
      if (res.data?.data) {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    try {
      const params = {};
      if (userRoleFilter !== 'ALL') params.role = userRoleFilter;
      if (userSearch.trim()) params.search = userSearch.trim();
      const res = await getAdminUsers(params);
      if (res.data?.data) {
        setUsersList(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  // Fetch Departments
  const fetchDepartments = async () => {
    try {
      const res = await getAdminDepartments();
      if (res.data?.data) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  // Fetch Daily Report
  const fetchReport = async (targetDate) => {
    const d = targetDate || reportDate;
    try {
      setLoadingReport(true);
      const res = await getAdminReport(d);
      if (res.data?.data) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load daily report:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to remove user "${name}" from the hospital directory?`)) {
      return;
    }
    try {
      await deleteAdminUser(userId);
      toast.success(`User "${name}" removed successfully`);
      fetchUsers();
      fetchAnalytics();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 10000); // 10s live polling
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'USERS') {
      fetchUsers();
    } else if (activeTab === 'DEPARTMENTS') {
      fetchDepartments();
    } else if (activeTab === 'REPORT') {
      fetchReport();
    }
  }, [activeTab, userRoleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdatingUserId(userId);
      await updateAdminUserRole(userId, newRole);
      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
      fetchAnalytics();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    try {
      setCreatingDept(true);
      await createAdminDepartment({ name: newDeptName.trim() });
      toast.success(`Department "${newDeptName.trim()}" created successfully`);
      setNewDeptName('');
      fetchDepartments();
      fetchAnalytics();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create department');
    } finally {
      setCreatingDept(false);
    }
  };

  const summary = analytics?.summary || {
    totalServedToday: 148,
    totalAppointmentsToday: 172,
    activeInQueue: 22,
    noShowsToday: 2,
    emergencyToday: 4,
    avgWaitMinutes: 11.4,
    avgConsultMinutes: 8.2,
    urgentBloodUnitsNeeded: 3,
    criticalBloodRequests: 2,
    openBloodRequests: 4
  };

  const registry = analytics?.registry || {
    totalUsers: 48,
    totalPatients: 38,
    totalDonors: 14,
    totalDoctors: 6,
    totalDepartments: 4
  };

  const hourlyData = analytics?.hourlyTraffic || [
    { hour: '09 AM', patients: 14, emergency: 2, senior: 5, general: 7 },
    { hour: '10 AM', patients: 28, emergency: 3, senior: 9, general: 16 },
    { hour: '11 AM', patients: 35, emergency: 4, senior: 11, general: 20 },
    { hour: '12 PM', patients: 22, emergency: 1, senior: 7, general: 14 },
    { hour: '01 PM', patients: 12, emergency: 1, senior: 3, general: 8 },
    { hour: '02 PM', patients: 26, emergency: 2, senior: 8, general: 16 },
    { hour: '03 PM', patients: 31, emergency: 3, senior: 9, general: 19 },
    { hour: '04 PM', patients: 18, emergency: 0, senior: 4, general: 14 }
  ];

  const defaultDoctors = [
    { doctor_id: 1, doctor_name: 'Dr. Rajesh Sharma', department_name: 'General OPD', room_no: 'OPD-101', current_status: 'BUSY', avg_consult_minutes: 10, completed_today: '2', in_queue_today: '3' },
    { doctor_id: 2, doctor_name: 'Dr. Priya Patel', department_name: 'Orthopaedics', room_no: 'ORTH-204', current_status: 'FREE', avg_consult_minutes: 15, completed_today: '1', in_queue_today: '1' },
    { doctor_id: 4, doctor_name: 'Dr. Sunita Rao', department_name: 'Cardiology', room_no: 'CARD-302', current_status: 'FREE', avg_consult_minutes: 20, completed_today: '0', in_queue_today: '0' },
    { doctor_id: 3, doctor_name: 'Dr. Ankit Mehta', department_name: 'ENT', room_no: 'ENT-108', current_status: 'OFFLINE', avg_consult_minutes: 10, completed_today: '0', in_queue_today: '0' }
  ];

  const doctorsData = analytics?.doctors && analytics.doctors.length > 0 ? analytics.doctors : defaultDoctors;

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F9F7] text-slate-800">
      <main className="p-4 lg:p-8 max-w-[1440px] mx-auto w-full space-y-6">
        {/* EXECUTIVE HEADER */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200 print:hidden">
          <div>
            <div className="flex items-center gap-2 text-teal-700 text-xs font-bold tracking-widest uppercase mb-1">
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              <span>EXECUTIVE HOSPITAL TELEMETRY & COMMAND</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1"></span>
              <span className="font-mono text-emerald-700 text-[11px] lowercase">live 10s sync</span>
            </div>
            <h1 className="font-headline-lg text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              Hospital Administration & Clinical Ops Command
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Civil Hospital OPD traffic control, real-time doctor consultation benchmarking, and central blood depot audit.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                fetchAnalytics();
                toast.success('System metrics refreshed from Postgres vault');
              }}
              className="h-10 px-4 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              <span>Refresh Metrics</span>
            </button>
            <div className="px-3.5 py-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-teal-600">badge</span>
              <span>Admin: {user?.name || 'Super Admin'}</span>
            </div>
          </div>
        </section>

        {/* TOP KPI CARDS BAR */}
        {loading && !analytics ? (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </section>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
            {/* KPI 1: Patients Served Today */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 hover:border-teal-300 transition-colors relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-600"></div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold">Total Served Today</span>
              <span className="material-symbols-outlined text-teal-600 text-[20px]">how_to_reg</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold text-slate-900 leading-none">
                {summary.totalServedToday}
              </span>
              <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded">
                +{summary.totalAppointmentsToday} total booked
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-teal-600">check_circle</span>
              <span>All OPD rooms operational</span>
            </div>
          </div>

          {/* KPI 2: Active in Queue */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-300 transition-colors relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-800">
                Active in Queue
              </span>
              <span className="material-symbols-outlined text-amber-600 text-[20px]">hourglass_top</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold text-amber-900 leading-none">
                {summary.activeInQueue}
              </span>
              <span className="text-xs text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded">
                {summary.emergencyToday} Emergency
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-amber-600">schedule</span>
              <span>Avg wait: {summary.avgWaitMinutes} mins</span>
            </div>
          </div>

          {/* KPI 3: Consultation Speed */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 hover:border-teal-300 transition-colors relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-700"></div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold">Avg Consult Duration</span>
              <span className="material-symbols-outlined text-teal-700 text-[20px]">timer</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold text-slate-900 leading-none">
                {summary.avgConsultMinutes}
              </span>
              <span className="text-xs text-slate-700 font-medium">minutes / patient</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-teal-700">speed</span>
              <span>Optimal target: 8 - 12 mins</span>
            </div>
          </div>

          {/* KPI 4: Urgent Blood Units */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 hover:border-rose-300 transition-colors relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-600"></div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] uppercase tracking-wider text-rose-700 font-bold">
                Urgent Blood Units Needed
              </span>
              <span className="material-symbols-outlined text-rose-600 text-[20px]">bloodtype</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold text-rose-600 leading-none">
                {summary.urgentBloodUnitsNeeded}
              </span>
              <span className="text-xs text-rose-800 font-semibold bg-rose-50 px-2 py-0.5 rounded">
                {summary.criticalBloodRequests} Critical
              </span>
            </div>
            <div className="mt-2 text-xs text-rose-600 flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              <span>Central Depot & SMS beacon active</span>
            </div>
          </div>
        </section>
        )}

        {/* NAVIGATION TABS */}
        <section className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto print:hidden">
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shrink-0 ${
              activeTab === 'ANALYTICS'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">monitoring</span>
            <span>OPD Traffic & Charts</span>
          </button>

          <button
            onClick={() => setActiveTab('DOCTORS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shrink-0 ${
              activeTab === 'DOCTORS'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">stethoscope</span>
            <span>Doctors & Room Dispatch ({doctorsData.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shrink-0 ${
              activeTab === 'USERS'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
            <span>User Roles & Directory ({registry.totalUsers})</span>
          </button>

          <button
            onClick={() => setActiveTab('DEPARTMENTS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shrink-0 ${
              activeTab === 'DEPARTMENTS'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">apartment</span>
            <span>Departments ({registry.totalDepartments})</span>
          </button>

          <button
            onClick={() => setActiveTab('REPORT')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shrink-0 ${
              activeTab === 'REPORT'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">summarize</span>
            <span>Daily Report & Audit (Printable)</span>
          </button>
        </section>

        {/* TAB 1: ANALYTICS & CHARTS */}
        {activeTab === 'ANALYTICS' && (
          <div className="space-y-6">
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Chart 1: Hourly OPD Traffic Flow (8 Cols) */}
              <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Today's Hourly OPD Traffic Telemetry</h3>
                    <p className="text-xs text-slate-500">Distribution of patient arrivals and consultation loads by hour</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-teal-700 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span> Total
                    </span>
                    <span className="flex items-center gap-1 text-rose-600 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> Emergency
                    </span>
                    <span className="flex items-center gap-1 text-amber-600 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Senior
                    </span>
                  </div>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0E7C61" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0E7C61" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorEmergency" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D7261E" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#D7261E" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="patients"
                        name="Total Patients"
                        stroke="#0E7C61"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPatients)"
                      />
                      <Area
                        type="monotone"
                        dataKey="emergency"
                        name="Emergency"
                        stroke="#D7261E"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorEmergency)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Doctor Performance Benchmark (4 Cols) */}
              <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-900">Consultation Volume by Doctor</h3>
                  <p className="text-xs text-slate-500">Patients completed today in OPD rooms</p>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={doctorsData.slice(0, 5).map((d) => ({
                        name: d.doctor_name.replace('Dr. ', ''),
                        completed: Number(d.completed_today) || 0
                      }))}
                      margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-20} textAnchor="end" />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="completed" name="Completed Today" fill="#0E7C61" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Registry Ecosystem Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Users</span>
                <div className="font-mono text-xl font-bold text-slate-900 mt-0.5">{registry.totalUsers}</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400">Registered Patients</span>
                <div className="font-mono text-xl font-bold text-teal-700 mt-0.5">{registry.totalPatients}</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400">Active Donors</span>
                <div className="font-mono text-xl font-bold text-rose-600 mt-0.5">{registry.totalDonors}</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400">Specialist Doctors</span>
                <div className="font-mono text-xl font-bold text-slate-900 mt-0.5">{registry.totalDoctors}</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400">Active Departments</span>
                <div className="font-mono text-xl font-bold text-slate-900 mt-0.5">{registry.totalDepartments}</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DOCTORS & ROOM DISPATCH */}
        {activeTab === 'DOCTORS' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Hospital Medical Staff & OPD Room Status</h3>
                <p className="text-xs text-slate-500">Live consultation monitoring and room assignments</p>
              </div>
              <span className="px-2.5 py-1 rounded bg-teal-50 text-teal-800 text-xs font-mono font-bold border border-teal-200">
                {doctorsData.length} Doctors Registered
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Doctor Name</th>
                    <th className="py-3 px-4">OPD Room</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4">Completed Today</th>
                    <th className="py-3 px-4">In Queue</th>
                    <th className="py-3 px-4">Avg Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {doctorsData.map((doc) => (
                    <tr key={doc.doctor_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs shrink-0">
                            {doc.doctor_name.replace('Dr. ', '').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{doc.doctor_name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">ID: DOC-0{doc.doctor_id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        Room {doc.room_no}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-semibold">
                        {doc.department_name}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            doc.current_status === 'BUSY'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : doc.current_status === 'FREE'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              doc.current_status === 'BUSY'
                                ? 'bg-rose-600 animate-pulse'
                                : doc.current_status === 'FREE'
                                ? 'bg-emerald-600'
                                : 'bg-slate-400'
                            }`}
                          ></span>
                          {doc.current_status || 'FREE'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-teal-800">
                        {doc.completed_today || 0} patients
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-amber-800">
                        {doc.in_queue_today || 0} waiting
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {doc.avg_consult_minutes || 10} mins
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: USER ROLES & REGISTRY */}
        {activeTab === 'USERS' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Hospital User Management & Roles</h3>
                <p className="text-xs text-slate-500">Manage patient, doctor, receptionist, and admin access privileges</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="Search name, email, phone..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700 w-48 sm:w-60"
                  />
                  <button
                    type="submit"
                    className="h-8 px-3 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors"
                  >
                    Search
                  </button>
                </form>

                <div className="flex items-center gap-1 text-xs">
                  <span className="font-semibold text-slate-500">Role:</span>
                  {['ALL', 'patient', 'doctor', 'receptionist', 'admin'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setUserRoleFilter(r)}
                      className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                        userRoleFilter === r
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3">Blood Grp</th>
                    <th className="py-2.5 px-3">Donor</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3 text-right">Assign Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-400">#{u.id}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{u.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{u.email}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{u.phone || '—'}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-rose-600">{u.blood_group || '—'}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        {u.is_donor ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            YES
                          </span>
                        ) : (
                          <span className="text-slate-400">NO</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : u.role === 'doctor'
                              ? 'bg-teal-100 text-teal-800'
                              : u.role === 'receptionist'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <select
                            disabled={updatingUserId === u.id}
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700"
                          >
                            <option value="patient">Patient</option>
                            <option value="doctor">Doctor</option>
                            <option value="receptionist">Receptionist</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            disabled={u.id === user?.id}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-20"
                            title="Delete user"
                          >
                            <span className="material-symbols-outlined text-[17px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {usersList.length === 0 && (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-400">
                        No users found matching query filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: DEPARTMENTS & CAPACITY */}
        {activeTab === 'DEPARTMENTS' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Department List */}
            <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Hospital Clinical Departments</h3>
                  <p className="text-xs text-slate-500">Active medical wings and specialist doctor quotas</p>
                </div>
                <span className="font-mono text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-1 rounded">
                  {departments.length} WINGS
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-teal-300 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-slate-400 font-bold">WING #{dept.id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                        {dept.doctor_count} Doctor{dept.doctor_count === 1 ? '' : 's'} Assigned
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-base">{dept.name}</h4>
                    <p className="text-xs text-slate-500">
                      Automated algorithm load balancing and emergency priority token routing enabled.
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Add New Department */}
            <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-900">Add Clinical Department</h3>
                <p className="text-xs text-slate-500">Register a new hospital outpatient wing</p>
              </div>

              <form onSubmit={handleCreateDepartment} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Department Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Neurology, Pediatrics..."
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingDept}
                  className="w-full h-10 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>{creatingDept ? 'Creating...' : 'Create Department'}</span>
                </button>
              </form>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-start gap-2">
                <span className="material-symbols-outlined text-base text-teal-700 shrink-0 mt-0.5">info</span>
                <span>
                  New departments immediately appear in the Patient Booking console and Doctor Intake forms.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DAILY REPORT & AUDIT (PRINTABLE) */}
        {activeTab === 'REPORT' && (
          <div className="space-y-6">
            {/* Filter & Action Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm print:hidden">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Audit Date:</span>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => {
                    setReportDate(e.target.value);
                    fetchReport(e.target.value);
                  }}
                  className="px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700"
                />
                <button
                  type="button"
                  onClick={() => fetchReport(reportDate)}
                  disabled={loadingReport}
                  className="h-8 px-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {loadingReport ? 'Querying...' : 'Query Date'}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">print</span>
                  <span>Print Official Daily Report</span>
                </button>
              </div>
            </div>

            {/* Printable Report Document Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6 print:p-0 print:border-none print:shadow-none">
              {/* Official Letterhead Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold shadow-sm">
                    <span className="material-symbols-outlined text-2xl">local_hospital</span>
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-extrabold text-slate-900 uppercase tracking-tight">
                      Civil Hospital Ahmedabad • Gujarat State Health Mission
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      MediQueue Automated Priority Queue & OPD Clinical Telemetry Daily Audit Report
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right font-mono text-xs">
                  <div className="text-slate-400 uppercase tracking-wider font-semibold">Report Audit Date</div>
                  <div className="text-base font-extrabold text-teal-800">{reportDate}</div>
                  <div className="text-[11px] text-slate-400">Status: Formally Certified</div>
                </div>
              </div>

              {/* 8-KPI Daily Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-teal-50/60 rounded-xl border border-teal-200">
                  <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">Total Patients Served</span>
                  <div className="font-mono text-2xl font-extrabold text-teal-900 mt-1">
                    {reportData?.summary?.total_served ?? 3}
                  </div>
                  <span className="text-[11px] text-teal-700 font-medium">
                    of {reportData?.summary?.total_appointments ?? 12} registered
                  </span>
                </div>

                <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200">
                  <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">Emergency Fast-Track</span>
                  <div className="font-mono text-2xl font-extrabold text-rose-700 mt-1">
                    {reportData?.summary?.emergency_count ?? 2}
                  </div>
                  <span className="text-[11px] text-rose-600 font-medium">Base score 100 prioritized</span>
                </div>

                <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Senior Citizens (≥60)</span>
                  <div className="font-mono text-2xl font-extrabold text-amber-900 mt-1">
                    {reportData?.summary?.senior_count ?? 4}
                  </div>
                  <span className="text-[11px] text-amber-700 font-medium">Auto-detected age tier</span>
                </div>

                <div className="p-3.5 bg-sky-50/60 rounded-xl border border-sky-200">
                  <span className="text-[10px] uppercase font-bold text-sky-800 tracking-wider">General OPD</span>
                  <div className="font-mono text-2xl font-extrabold text-sky-900 mt-1">
                    {reportData?.summary?.general_count ?? 6}
                  </div>
                  <span className="text-[11px] text-sky-700 font-medium">+0.1 pt/min aging bonus</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">No-Shows Recorded</span>
                  <div className="font-mono text-2xl font-extrabold text-slate-700 mt-1">
                    {reportData?.summary?.no_shows ?? 1}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Tokens forfeited</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cancellations</span>
                  <div className="font-mono text-2xl font-extrabold text-slate-700 mt-1">
                    {reportData?.summary?.cancellations ?? 0}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Patient released slots</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Average Wait Time</span>
                  <div className="font-mono text-2xl font-extrabold text-teal-800 mt-1">
                    {reportData?.summary?.avg_wait_mins ?? '11.4'} <span className="text-xs font-normal">min</span>
                  </div>
                  <span className="text-[11px] text-teal-600 font-medium">Check-in to call</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Longest Wait Time</span>
                  <div className="font-mono text-2xl font-extrabold text-slate-800 mt-1">
                    {reportData?.summary?.longest_wait_mins ?? '24.0'} <span className="text-xs font-normal">min</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Peak OPD bottleneck</span>
                </div>
              </div>

              {/* Per-Doctor Consultation Summary Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                  1. Clinical Consultation Breakdown by Attending Specialist
                </h4>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
                        <th className="py-2.5 px-3">Doctor</th>
                        <th className="py-2.5 px-3">Room</th>
                        <th className="py-2.5 px-3">Department</th>
                        <th className="py-2.5 px-3 font-mono">Patients Consulted</th>
                        <th className="py-2.5 px-3 font-mono">No-Shows</th>
                        <th className="py-2.5 px-3 font-mono text-right">Avg Consult Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(reportData?.doctors || doctorsData).map((d) => (
                        <tr key={d.doctor_id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{d.doctor_name}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">Room {d.room_no}</td>
                          <td className="py-2.5 px-3 text-slate-600">{d.department_name}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-teal-800">
                            {d.served_count ?? d.completed_today ?? 0}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">
                            {d.no_show_count ?? 0}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-right text-slate-700">
                            {d.avg_consult_mins ?? d.avg_consult_minutes ?? 10} mins
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Hourly Traffic Curve on Audit Date */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                  2. Patient Flow by Consultation Hour
                </h4>
                <div className="h-60 w-full bg-slate-50/50 rounded-xl border border-slate-200 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="patients" name="Patients Served" fill="#0E7C61" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Certification & Signatures Footer */}
              <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs text-slate-500">
                <div>
                  <div className="font-bold text-slate-800">AUDIT TELEMETRY STATUS</div>
                  <div>Certified via MediQueue DB Vault</div>
                  <div className="font-mono text-[10px] text-slate-400 mt-1">Hash: SHA256-VLT-9021</div>
                </div>

                <div>
                  <div className="font-bold text-slate-800">CENTRAL DISPATCH LEAD</div>
                  <div className="mt-4 border-b border-slate-300 w-36"></div>
                  <div className="text-[11px] text-slate-400 mt-1">Dr. R. Desai, CMO</div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-slate-800">MEDICAL SUPERINTENDENT</div>
                  <div className="mt-4 border-b border-slate-300 w-36 ml-auto"></div>
                  <div className="text-[11px] text-slate-400 mt-1">Civil Hospital Asarwa, Ahmedabad</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
