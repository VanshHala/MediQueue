import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getBloodRequests, createBloodRequest, fulfillBloodRequest } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { BloodRequestSkeleton } from '../../components/Skeleton';

const AHMEDABAD_AREAS = [
  { name: 'Civil Hospital Asarwa', lat: 23.0524, lon: 72.5936 },
  { name: 'Navrangpura', lat: 23.0365, lon: 72.5611 },
  { name: 'Satellite', lat: 23.0304, lon: 72.5178 },
  { name: 'Maninagar', lat: 22.9978, lon: 72.6033 },
  { name: 'Paldi', lat: 23.0128, lon: 72.5629 },
  { name: 'Vastrapur', lat: 23.0350, lon: 72.5293 },
  { name: 'Ellisbridge', lat: 23.0232, lon: 72.5714 },
  { name: 'Bopal', lat: 23.0338, lon: 72.4634 }
];

const BLOOD_GROUPS = ['ALL', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const BloodRequestsBoard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Filters & Search
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // 'ALL' | 'OPEN' | 'FULFILLED'
  const [selectedUrgency, setSelectedUrgency] = useState('ALL'); // 'ALL' | 'CRITICAL'
  const [searchQuery, setSearchQuery] = useState('');

  // Data & Loading
  const [liveRequests, setLiveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fulfillingId, setFulfillingId] = useState(null);

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    patient_name: '',
    blood_group: 'B+',
    units_required: 2,
    urgency: 'CRITICAL',
    hospital_name: 'Civil Hospital Ahmedabad - Trauma Wing',
    contact_phone: user?.phone || '9876543210',
    notes: 'Urgent emergency transfusion required',
    selectedAreaIndex: 0
  });

  // Fetch real requests from PostgreSQL
  const fetchRequests = useCallback(async () => {
    try {
      const res = await getBloodRequests({ status: 'ALL' });
      if (res.data?.data) {
        setLiveRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load blood requests', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, [fetchRequests]);

  // Create Requisition
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const area = AHMEDABAD_AREAS[formData.selectedAreaIndex] || AHMEDABAD_AREAS[0];
      await createBloodRequest({
        patient_name: formData.patient_name.trim() || 'Emergency Patient',
        blood_group: formData.blood_group,
        units_required: Number(formData.units_required) || 1,
        urgency: formData.urgency,
        hospital_name: formData.hospital_name.trim() || 'Civil Hospital Ahmedabad',
        contact_phone: formData.contact_phone.trim() || '9876543210',
        notes: formData.notes.trim() || null,
        latitude: area.lat,
        longitude: area.lon
      });
      toast.success('Emergency requisition broadcasted successfully!', { icon: '🩸' });
      setShowModal(false);
      // Reset form
      setFormData({
        patient_name: '',
        blood_group: 'B+',
        units_required: 2,
        urgency: 'CRITICAL',
        hospital_name: 'Civil Hospital Ahmedabad - Trauma Wing',
        contact_phone: user?.phone || '9876543210',
        notes: '',
        selectedAreaIndex: 0
      });
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create requisition');
    } finally {
      setSubmitting(false);
    }
  };

  // Mark Request as Fulfilled
  const handleFulfill = async (id) => {
    try {
      setFulfillingId(id);
      const res = await fulfillBloodRequest(id);
      if (res.data?.success) {
        toast.success(`Requisition #REQ-${id} marked as FULFILLED!`);
        fetchRequests();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update requisition status');
    } finally {
      setFulfillingId(null);
    }
  };

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    return liveRequests.filter((req) => {
      // Blood Group filter
      if (selectedGroup !== 'ALL' && req.blood_group !== selectedGroup) return false;

      // Status filter
      if (selectedStatus === 'OPEN' && req.status !== 'OPEN') return false;
      if (selectedStatus === 'FULFILLED' && req.status !== 'FULFILLED') return false;

      // Urgency filter
      if (selectedUrgency === 'CRITICAL' && req.urgency !== 'CRITICAL') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesPatient = req.patient_name?.toLowerCase().includes(q);
        const matchesHospital = req.hospital_name?.toLowerCase().includes(q);
        const matchesNotes = req.notes?.toLowerCase().includes(q);
        const matchesPhone = req.contact_phone?.includes(q);
        if (!matchesPatient && !matchesHospital && !matchesNotes && !matchesPhone) {
          return false;
        }
      }

      return true;
    });
  }, [liveRequests, selectedGroup, selectedStatus, selectedUrgency, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F9F7]">
      {/* Main Container */}
      <main className="p-4 lg:p-8 max-w-[1440px] mx-auto w-full space-y-6">
        {/* SCREEN HEADER */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-1.5 text-brand-darkGreen text-xs font-bold tracking-widest uppercase mb-1">
              <span className="material-symbols-outlined text-[15px]">bloodtype</span>
              <span>BLOOD DEPOT & TRANSFUSION REGISTRY</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              Emergency Blood Requisitions
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Live hospital requisitions and donor dispatch across the Ahmedabad healthcare network.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Link
              to="/find-donors"
              className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px] text-brand-darkGreen">person_search</span>
              <span>Find Voluntary Donors</span>
            </Link>

            <button
              onClick={() => setShowModal(true)}
              className="h-10 px-5 rounded-xl bg-brand-darkGreen hover:bg-teal-900 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Post Blood Requisition</span>
            </button>
          </div>
        </section>

        {/* SEARCH & FILTER CONTROLS */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Search by patient, hospital, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-darkGreen"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>

            {/* Status & Urgency Pills */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Status:</span>
              <button
                onClick={() => setSelectedStatus('ALL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  selectedStatus === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedStatus('OPEN')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  selectedStatus === 'OPEN'
                    ? 'bg-brand-darkGreen text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Active / Open
              </button>
              <button
                onClick={() => setSelectedStatus('FULFILLED')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  selectedStatus === 'FULFILLED'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Fulfilled
              </button>

              <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>

              <button
                onClick={() => setSelectedUrgency(selectedUrgency === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors ${
                  selectedUrgency === 'CRITICAL'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">warning</span>
                <span>Critical Only</span>
              </button>
            </div>
          </div>

          {/* Blood Group Selectors */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mr-2 shrink-0">
              Blood Group:
            </span>
            {BLOOD_GROUPS.map((grp) => {
              const isActive = selectedGroup === grp;
              return (
                <button
                  key={grp}
                  onClick={() => setSelectedGroup(grp)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg shrink-0 transition-all ${
                    isActive
                      ? 'bg-brand-darkGreen text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {grp}
                </button>
              );
            })}
          </div>
        </section>

        {/* TWO-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: ACTIVE REQUISITIONS STREAM (8 Cols) */}
          <section className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Live Requisitions</h2>
                <span className="bg-slate-100 text-slate-700 font-mono text-xs font-bold px-2 py-0.5 rounded-full border border-slate-200">
                  {filteredRequests.length}
                </span>
              </div>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Telemetry</span>
              </span>
            </div>

            {/* SKELETON LOADING */}
            {loading && liveRequests.length === 0 ? (
              <div className="space-y-4">
                <BloodRequestSkeleton />
                <BloodRequestSkeleton />
                <BloodRequestSkeleton />
              </div>
            ) : filteredRequests.length === 0 ? (
              /* EMPTY STATE */
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-2xl">bloodtype</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">No Requisitions Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery || selectedGroup !== 'ALL' || selectedStatus !== 'ALL'
                    ? 'No requests match your selected filters. Try clearing your search or switching to "All".'
                    : 'No active blood requisitions in the registry currently.'}
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  {(searchQuery || selectedGroup !== 'ALL' || selectedStatus !== 'ALL' || selectedUrgency !== 'ALL') && (
                    <button
                      onClick={() => {
                        setSelectedGroup('ALL');
                        setSelectedStatus('ALL');
                        setSelectedUrgency('ALL');
                        setSearchQuery('');
                      }}
                      className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                  <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-brand-darkGreen text-white text-xs font-bold rounded-xl hover:bg-teal-900 transition-colors shadow-xs"
                  >
                    Post New Request
                  </button>
                </div>
              </div>
            ) : (
              /* REAL REQUISITIONS LIST */
              filteredRequests.map((req) => {
                const isCritical = req.urgency === 'CRITICAL';
                const isFulfilled = req.status === 'FULFILLED';
                const units = req.units || req.units_required || req.units_needed || 1;

                return (
                  <article
                    key={req.id}
                    className={`bg-white rounded-2xl border p-5 relative overflow-hidden shadow-xs transition-all ${
                      isFulfilled
                        ? 'border-slate-200 opacity-90'
                        : isCritical
                        ? 'border-rose-300 ring-1 ring-rose-100'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      {/* Left: Patient and Hospital Details */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded">
                            #REQ-{req.id}
                          </span>

                          {/* Urgency / Status Pill */}
                          {isFulfilled ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">check_circle</span>
                              <span>FULFILLED</span>
                            </span>
                          ) : isCritical ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                              <span>CRITICAL (&lt; 30 MINS)</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold bg-teal-50 text-brand-darkGreen border border-teal-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-darkGreen"></span>
                              <span>{req.urgency || 'ACTIVE'}</span>
                            </span>
                          )}

                          {req.created_at && (
                            <span className="text-slate-400 font-mono text-xs flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              {new Date(req.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>

                        <div className="pt-0.5">
                          <h3
                            className={`text-base font-bold ${
                              isCritical ? 'text-rose-700' : 'text-slate-900'
                            }`}
                          >
                            {req.blood_group} &bull; {units} Unit{units > 1 ? 's' : ''} Needed
                          </h3>
                          <p className="text-xs text-slate-600 mt-0.5">
                            For <strong className="font-semibold text-slate-900">{req.hospital_name}</strong>
                            {req.city ? ` (${req.city})` : ''}
                          </p>
                        </div>

                        {req.notes && (
                          <p className="text-xs text-slate-500 italic bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                            &ldquo;{req.notes}&rdquo;
                          </p>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-1 gap-x-4 pt-2 text-xs border-t border-slate-100 text-slate-500">
                          <div>
                            <span>Patient:</span>
                            <span className="text-slate-900 font-semibold ml-1">{req.patient_name}</span>
                          </div>
                          <div>
                            <span>Contact:</span>
                            <a
                              href={`tel:${req.contact_phone}`}
                              className="font-mono text-brand-darkGreen font-semibold ml-1 hover:underline"
                            >
                              {req.contact_phone}
                            </a>
                          </div>
                          <div>
                            <span>Status:</span>
                            <span className="font-semibold text-slate-700 ml-1">{req.status}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Blood Group Badge */}
                      <div className="shrink-0 flex sm:flex-col items-center justify-center p-3 rounded-xl bg-slate-50 border border-slate-200 min-w-[90px] text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">GROUP</span>
                        <span className="font-mono text-2xl font-black text-rose-600">{req.blood_group}</span>
                        <span className="font-mono text-xs text-slate-600 font-semibold">
                          {units} Unit{units > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="material-symbols-outlined text-[16px] text-brand-darkGreen">
                          location_on
                        </span>
                        <span>{req.city || 'Ahmedabad Central Zone'}</span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Direct Phone Call */}
                        {req.contact_phone && (
                          <a
                            href={`tel:${req.contact_phone}`}
                            className="h-8 px-3 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[15px]">call</span>
                            <span>Call</span>
                          </a>
                        )}

                        {/* Match Local Donors */}
                        <button
                          onClick={() => navigate(`/find-donors?group=${encodeURIComponent(req.blood_group)}`)}
                          className="h-8 px-3.5 rounded-lg bg-brand-darkGreen hover:bg-teal-900 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[15px]">person_search</span>
                          <span>Match Compatible Donors</span>
                        </button>

                        {/* Mark As Fulfilled Button */}
                        {!isFulfilled && (
                          <button
                            onClick={() => handleFulfill(req.id)}
                            disabled={fulfillingId === req.id}
                            className="h-8 px-3 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[15px]">check</span>
                            <span>{fulfillingId === req.id ? 'Updating...' : 'Mark Fulfilled'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </section>

          {/* RIGHT COLUMN: REQUISITION HELPER & COMPATIBILITY GUIDE (4 Cols) */}
          <section className="lg:col-span-4 space-y-5">
            {/* 1. Post New Requisition Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-brand-darkGreen">
                <span className="material-symbols-outlined text-xl">emergency_share</span>
                <h3 className="font-bold text-sm text-slate-900">Need Immediate Blood?</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Broadcast an emergency blood requisition across hospitals, trauma centers, and registered voluntary donors in Ahmedabad.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="w-full h-10 rounded-xl bg-brand-darkGreen hover:bg-teal-900 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <span className="material-symbols-outlined text-[17px]">add_circle</span>
                <span>Post Blood Requisition</span>
              </button>
            </div>

            {/* 2. Clinical Compatibility Reference Guide */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5 text-brand-darkGreen">
                  <span className="material-symbols-outlined text-lg">medical_services</span>
                  <h3 className="font-bold text-sm text-slate-900">RBC Compatibility Guide</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  CLINICAL
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2">Recipient</th>
                      <th className="py-2 text-right">Can Receive From</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    <tr className="bg-emerald-50/50">
                      <td className="py-2 font-bold text-emerald-900">AB+ (Universal)</td>
                      <td className="py-2 text-right text-emerald-800 font-semibold">All 8 Groups</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-bold text-slate-800">A+</td>
                      <td className="py-2 text-right text-slate-600">A+, A-, O+, O-</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-bold text-slate-800">B+</td>
                      <td className="py-2 text-right text-slate-600">B+, B-, O+, O-</td>
                    </tr>
                    <tr className="bg-rose-50/50">
                      <td className="py-2 font-bold text-rose-800">O- (Universal Donor)</td>
                      <td className="py-2 text-right text-rose-700 font-bold">O- Only</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-bold text-slate-800">O+</td>
                      <td className="py-2 text-right text-slate-600">O+, O-</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                Patients with <strong className="text-slate-700">O-</strong> blood are universal red cell donors, while <strong className="text-slate-700">AB+</strong> patients are universal recipients.
              </p>
            </div>

            {/* 3. Voluntary Donors Directory Link */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-brand-darkGreen">
                <span className="material-symbols-outlined text-lg">volunteer_activism</span>
                <h3 className="font-bold text-sm text-slate-900">Voluntary Donors Network</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connect directly with verified on-duty voluntary blood donors registered in Ahmedabad.
              </p>
              <Link
                to="/find-donors"
                className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[17px] text-brand-darkGreen">search</span>
                <span>Browse Registered Donors</span>
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* CREATE EMERGENCY BLOOD REQUISITION MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden my-8">
            <div className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 text-rose-600">
                  <span className="material-symbols-outlined text-2xl">bloodtype</span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Post Emergency Blood Requisition</h3>
                    <p className="text-xs text-slate-500">Broadcasts immediately to the Ahmedabad hospital registry</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateRequest} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Patient Name / UHID
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patel"
                      value={formData.patient_name}
                      onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-darkGreen"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Blood Group Required
                    </label>
                    <select
                      value={formData.blood_group}
                      onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-bold text-rose-600 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-darkGreen"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((grp) => (
                        <option key={grp} value={grp}>
                          {grp}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Units Required
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      required
                      value={formData.units_required}
                      onChange={(e) => setFormData({ ...formData, units_required: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-darkGreen"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Urgency Level
                    </label>
                    <select
                      value={formData.urgency}
                      onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-darkGreen"
                    >
                      <option value="CRITICAL">CRITICAL (&lt; 30 mins)</option>
                      <option value="URGENT">URGENT (&lt; 2 hrs)</option>
                      <option value="NORMAL">NORMAL (Elective)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Hospital / Facility Ward
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.hospital_name}
                      onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-darkGreen"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Hospital Zone / Area
                    </label>
                    <select
                      value={formData.selectedAreaIndex}
                      onChange={(e) => setFormData({ ...formData, selectedAreaIndex: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-darkGreen"
                    >
                      {AHMEDABAD_AREAS.map((a, idx) => (
                        <option key={a.name} value={idx}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-darkGreen"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Clinical Notes / Remarks
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Crossmatch ready at ICU Bay 2"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-darkGreen"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-brand-darkGreen hover:bg-teal-900 disabled:opacity-50 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">emergency_share</span>
                    <span>{submitting ? 'Submitting...' : 'Post Requisition'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BloodRequestsBoard;
