import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getBloodRequests, createBloodRequest } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
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

export const BloodRequestsBoard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');
  const [liveRequests, setLiveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    patient_name: '',
    blood_group: 'B+',
    units_required: 2,
    urgency: 'CRITICAL',
    hospital_name: 'Civil Hospital Ahmedabad - Trauma Wing',
    contact_phone: '9876543210',
    notes: 'Urgent emergency transfusion required immediately',
    selectedAreaIndex: 0
  });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await getBloodRequests();
      if (res.data?.data) {
        setLiveRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load blood requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000); // 10s polling
    return () => clearInterval(interval);
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const area = AHMEDABAD_AREAS[formData.selectedAreaIndex];
      await createBloodRequest({
        patient_name: formData.patient_name || 'Emergency Trauma Patient',
        blood_group: formData.blood_group,
        units_required: Number(formData.units_required),
        urgency: formData.urgency,
        hospital_name: formData.hospital_name,
        contact_phone: formData.contact_phone,
        notes: formData.notes,
        latitude: area.lat,
        longitude: area.lon
      });
      toast.success('Emergency requisition broadcasted to local telemetry network!', { icon: '🩸' });
      setShowModal(false);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create requisition');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F9F7]">

      {/* Main Container */}
      <main className="p-4 lg:p-8 max-w-[1440px] mx-auto w-full space-y-6">
        {/* SCREEN HEADER */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-1.5 text-teal-700 text-xs font-bold tracking-widest uppercase mb-1">
              <span className="material-symbols-outlined text-[15px]">vital_signs</span>
              <span>CRITICAL TRANSFUSION TELEMETRY</span>
            </div>
            <h1 className="font-headline-lg text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              {t('blood_section_title')}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {t('blood_section_desc')}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => toast.success('Live bank telemetry synced with Gujarat NBTC Vault')}
              className="h-10 px-4 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">sync</span>
              <span>{t('sync_live_bank')}</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="h-10 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>{t('create_urgent_requisition')}</span>
            </button>
          </div>
        </section>

        {/* TOP KPI / STATS BAR */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Active Urgent Requisitions */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 hover:border-rose-300 transition-colors relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-600"></div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] uppercase tracking-wider text-rose-700 font-bold">
                {t('active_urgent_reqs')}
              </span>
              <span className="material-symbols-outlined text-rose-600 text-[20px]">alarm</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold text-slate-900 leading-none">4</span>
              <span className="text-xs text-slate-700 font-semibold">Cases</span>
            </div>
            <div className="mt-2 text-xs text-rose-600 flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-[14px]">priority_high</span>
              <span>2 Critical Under 30 mins</span>
            </div>
          </div>

          {/* Metric 2: Units Dispatched Today */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 hover:border-teal-300 transition-colors relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-600"></div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold">
                {t('units_dispatched_today')}
              </span>
              <span className="material-symbols-outlined text-teal-600 text-[20px]">
                local_shipping
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold text-slate-900 leading-none">18</span>
              <span className="text-xs text-slate-700 font-semibold">{t('units_needed')}</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-teal-600">check_circle</span>
              <span>Packed RBC & Whole Blood</span>
            </div>
          </div>

          {/* Metric 3: Registered Donors on Alert */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 hover:border-teal-300 transition-colors relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-700"></div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold">
                {t('active_voluntary_donors')}
              </span>
              <span className="material-symbols-outlined text-teal-700 text-[20px]">
                notifications_active
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold text-slate-900 leading-none">
                142
              </span>
              <span className="text-xs text-slate-700 font-semibold">Active</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1 truncate">
              <span className="material-symbols-outlined text-[14px] text-teal-700">location_on</span>
              <span className="truncate">Ahmedabad Met Area (8km radius)</span>
            </div>
          </div>

          {/* Metric 4: Depot Reserve Status */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 hover:border-teal-300 transition-colors relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-800"></div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold">
                {t('depot_reserve_index')}
              </span>
              <span className="material-symbols-outlined text-teal-800 text-[20px]">
                inventory_2
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold text-slate-900 leading-none">86%</span>
              <span className="text-xs text-teal-700 font-semibold">Optimal</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-teal-600 h-full w-[86%] rounded-full"></div>
              </div>
            </div>
          </div>
        </section>

        {/* TWO-COLUMN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: ACTIVE REQUISITIONS STREAM (8 Cols) */}
          <section className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Active Requisitions Stream</h2>
                <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">
                  2 REALTIME ALERTS
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <span className="font-semibold mr-1">Filter:</span>
                <button
                  onClick={() => setFilter('ALL')}
                  className={`px-2.5 py-1 rounded font-semibold ${
                    filter === 'ALL' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('CRITICAL')}
                  className={`px-2.5 py-1 rounded font-semibold ${
                    filter === 'CRITICAL'
                      ? 'bg-rose-600 text-white'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Critical
                </button>
                <button
                  onClick={() => setFilter('FULFILLED')}
                  className={`px-2.5 py-1 rounded font-semibold ${
                    filter === 'FULFILLED'
                      ? 'bg-teal-600 text-white'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Fulfilled
                </button>
              </div>
            </div>

            {/* LIVE DATABASE REQUISITIONS */}
            {loading && liveRequests.length === 0 ? (
              <div className="space-y-4">
                <BloodRequestSkeleton />
                <BloodRequestSkeleton />
              </div>
            ) : (
              liveRequests
                .filter((req) => {
                  if (filter === 'ALL') return true;
                  if (filter === 'CRITICAL') return req.urgency === 'CRITICAL';
                  if (filter === 'FULFILLED') return req.status === 'FULFILLED';
                  return true;
                })
                .map((req) => (
                <article
                  key={req.id}
                  className={`bg-white rounded-xl border border-slate-200 p-5 relative overflow-hidden shadow-sm border-l-4 ${
                    req.urgency === 'CRITICAL' ? 'border-l-rose-600' : 'border-l-teal-600'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded">
                          #REQ-{String(req.id || '').slice(0, 8).toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold flex items-center gap-1 ${
                            req.status === 'FULFILLED'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : req.urgency === 'CRITICAL'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-teal-50 text-teal-800 border border-teal-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              req.status === 'FULFILLED'
                                ? 'bg-emerald-600'
                                : 'bg-rose-600 animate-pulse'
                            }`}
                          ></span>
                          {req.status === 'FULFILLED' ? 'FULFILLED' : `${req.urgency} TELEMETRY`}
                        </span>
                        <span className="text-slate-500 font-mono text-xs font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">schedule</span>
                          {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="pt-1">
                        <h3
                          className={`text-base font-bold ${
                            req.urgency === 'CRITICAL' ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {req.urgency === 'CRITICAL' ? 'URGENT: ' : ''}
                          {req.blood_group} {req.units_required} Unit{req.units_required > 1 ? 's' : ''} Required
                        </h3>
                        <p className="text-xs text-slate-700 mt-0.5">
                          For <strong className="font-semibold text-slate-900">{req.hospital_name}</strong>
                          {req.notes ? ` (${req.notes})` : ''}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-1 gap-x-4 pt-2 text-xs border-t border-slate-100 mt-3 text-slate-500">
                        <div>
                          <span>Patient:</span>
                          <span className="text-slate-800 font-semibold ml-1">{req.patient_name}</span>
                        </div>
                        <div>
                          <span>Contact:</span>
                          <span className="font-mono text-slate-800 ml-1">{req.contact_phone}</span>
                        </div>
                        <div>
                          <span>Status:</span>
                          <span className="text-teal-700 ml-1 font-medium font-mono">{req.status}</span>
                        </div>
                      </div>
                    </div>

                    {/* Blood Type Callout Badge */}
                    <div className="shrink-0 flex md:flex-col items-center justify-center p-3 rounded-xl bg-slate-50 border border-slate-200 min-w-[96px] text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">GROUP</span>
                      <span className="font-mono text-2xl font-bold text-rose-600">{req.blood_group}</span>
                      <span className="font-mono text-xs text-slate-600 font-semibold">
                        {req.units_required} Unit{req.units_required > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="material-symbols-outlined text-[17px] text-teal-600">
                        radar
                      </span>
                      <span>Real-time Ahmedabad geo-coordinates locked</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => navigate(`/find-donors?group=${encodeURIComponent(req.blood_group)}`)}
                        className="h-8 px-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[15px]">person_search</span>
                        <span>{t('match_local_donors')}</span>
                      </button>
                      <button
                        onClick={() => toast.success(`Encrypted beacon dispatched to nearby ${req.blood_group} donors`)}
                        className="h-8 px-3 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px]">cell_tower</span>
                        <span>{t('broadcast_sms')}</span>
                      </button>
                    </div>
                  </div>
                </article>
              )))}

            {/* REQUISITION CARD 1: REQ-9041 */}
            {(filter === 'ALL' || filter === 'CRITICAL') && (
              <article className="bg-white rounded-xl border border-slate-200 p-5 relative overflow-hidden shadow-sm border-l-4 border-l-rose-600">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded">
                        #REQ-9041
                      </span>
                      <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                        DISPATCH PENDING
                      </span>
                      <span className="text-rose-600 font-mono text-xs font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">timer</span>
                        Elapsed: 14 mins
                      </span>
                    </div>

                    <div className="pt-1">
                      <h3 className="text-base font-bold text-rose-600">
                        URGENT: B+ 2 Units Required
                      </h3>
                      <p className="text-xs text-slate-700 mt-0.5">
                        For <strong className="font-semibold text-slate-900">ICU Bay 4</strong>{' '}
                        (Trauma Surgery - Civil Hospital)
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-1 gap-x-4 pt-2 text-xs border-t border-slate-100 mt-3 text-slate-500">
                      <div>
                        <span>Patient UHID:</span>
                        <span className="font-mono text-slate-800 font-semibold ml-1">8841-2091</span>
                      </div>
                      <div>
                        <span>Attending:</span>
                        <span className="text-slate-800 ml-1 font-medium">
                          Dr. R. Desai (Trauma Lead)
                        </span>
                      </div>
                      <div>
                        <span>Blood Component:</span>
                        <span className="text-slate-800 ml-1 font-medium">PRBC Crossmatch</span>
                      </div>
                    </div>
                  </div>

                  {/* Blood Type Callout Badge */}
                  <div className="shrink-0 flex md:flex-col items-center justify-center p-3 rounded-xl bg-slate-50 border border-slate-200 min-w-[96px] text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">GROUP</span>
                    <span className="font-mono text-2xl font-bold text-rose-600">B+</span>
                    <span className="font-mono text-xs text-slate-600 font-semibold">2 Units</span>
                  </div>
                </div>

                {/* Action Cluster */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="material-symbols-outlined text-[17px] text-rose-600">
                      warning
                    </span>
                    <span>Immediate requisition requires depot approval within 16 mins</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => toast.success('Transfer initiated from Civil Depot 3')}
                      className="h-8 px-3 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[15px]">share_location</span>
                      <span>Transfer from Civil Depot 3</span>
                    </button>
                    <button
                      onClick={() => navigate('/find-donors?group=B+')}
                      className="h-8 px-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[15px]">person_search</span>
                      <span>Match Local Donors</span>
                    </button>
                    <button
                      onClick={() => toast.error('State NBTC Level 1 Alert Escalate Triggered')}
                      className="h-8 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[15px]">campaign</span>
                      <span>Escalate NBTC Alert</span>
                    </button>
                  </div>
                </div>
              </article>
            )}

            {/* REQUISITION CARD 2: REQ-9038 */}
            {(filter === 'ALL' || filter === 'CRITICAL') && (
              <article className="bg-white rounded-xl border border-slate-200 p-5 relative overflow-hidden shadow-sm border-l-4 border-l-teal-600">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded">
                        #REQ-9038
                      </span>
                      <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-ping"></span>
                        1 DONOR RESPONDED (EN ROUTE)
                      </span>
                      <span className="text-teal-700 font-mono text-xs font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">directions_bike</span>
                        ETA: 18 mins
                      </span>
                    </div>

                    <div className="pt-1">
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>O- Negative 1 Unit (Rare)</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded">
                          RARE PHENOTYPE
                        </span>
                      </h3>
                      <p className="text-xs text-slate-700 mt-0.5">
                        For <strong className="font-semibold text-slate-900">OT 2</strong> (Cardiac
                        Intervention - Aortic Repair)
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-1 gap-x-4 pt-2 text-xs border-t border-slate-100 mt-3 text-slate-500">
                      <div>
                        <span>Donor Name:</span>
                        <span className="text-slate-800 font-semibold ml-1">Vikram S.</span>
                      </div>
                      <div>
                        <span>Donor ID:</span>
                        <span className="font-mono text-slate-800 ml-1">91-4402-9912</span>
                      </div>
                      <div>
                        <span>Transit Route:</span>
                        <span className="text-slate-800 ml-1 font-medium">Ellisbridge → Civil OT</span>
                      </div>
                    </div>
                  </div>

                  {/* Group Callout */}
                  <div className="shrink-0 flex md:flex-col items-center justify-center p-3 rounded-xl bg-slate-50 border border-slate-200 min-w-[96px] text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">GROUP</span>
                    <span className="font-mono text-2xl font-bold text-rose-600">0-</span>
                    <span className="font-mono text-xs text-slate-600 font-semibold">1 Unit</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="material-symbols-outlined text-[17px] text-teal-600">
                      satellite_alt
                    </span>
                    <span>Live GPS ping recorded 42 seconds ago (Satellite Locked)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toast('Donor Medical Record retrieved')}
                      className="h-8 px-3 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[15px]">badge</span>
                      <span>View Medical Record</span>
                    </button>
                    <button
                      onClick={() => toast.success('Telemetry tracking: Donor 2.4 km away on Ashram Road')}
                      className="h-8 px-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[15px]">sensors</span>
                      <span>Track Vitals & ETA</span>
                    </button>
                  </div>
                </div>
              </article>
            )}

            {/* REQUISITION CARD 3: REQ-9029 */}
            {(filter === 'ALL' || filter === 'FULFILLED') && (
              <article className="bg-white rounded-xl border border-slate-200 p-5 relative overflow-hidden shadow-sm border-l-4 border-l-emerald-600">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded">
                        #REQ-9029
                      </span>
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">done_all</span>
                        FULFILLED & LOGGED
                      </span>
                      <span className="text-slate-500 font-mono text-xs">
                        Completed at 10:45 AM
                      </span>
                    </div>

                    <div className="pt-1">
                      <h3 className="text-base font-bold text-slate-900">A+ 3 Units</h3>
                      <p className="text-xs text-slate-700 mt-0.5">
                        For <strong className="font-semibold text-slate-900">Ward 12</strong>{' '}
                        (Oncology Daycare - Platelet Transfusion Complete)
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-1 gap-x-4 pt-2 text-xs border-t border-slate-100 mt-3 text-slate-500">
                      <div>
                        <span>Patient UHID:</span>
                        <span className="font-mono text-slate-800 font-semibold ml-1">7720-4105</span>
                      </div>
                      <div>
                        <span>Depot Batch:</span>
                        <span className="font-mono text-slate-800 ml-1">B-9982-A</span>
                      </div>
                      <div>
                        <span>Dispensed By:</span>
                        <span className="text-slate-800 ml-1 font-medium">Sr. Tech K. Sharma</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex md:flex-col items-center justify-center p-3 rounded-xl bg-slate-50 border border-slate-200 min-w-[96px] text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">GROUP</span>
                    <span className="font-mono text-2xl font-bold text-teal-700">A+</span>
                    <span className="font-mono text-xs text-slate-600 font-semibold">3 Units</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">
                    Chain-of-custody smart voucher #V-2041 logged to State Telemetry
                  </span>
                  <button
                    onClick={() => toast.success('Downloaded Clinical Receipt')}
                    className="h-8 px-3 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">receipt</span>
                    <span>Download Clinical Receipt</span>
                  </button>
                </div>
              </article>
            )}
          </section>

          {/* RIGHT COLUMN: DEPOT LIVE INVENTORY & INTAKE (4 Cols) */}
          <section className="lg:col-span-4 space-y-4">
            {/* 1. Depot Live Inventory Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Depot Live Inventory</h3>
                  <span className="text-xs text-slate-500">Central Reserve Vault #1</span>
                </div>
                <span className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded text-[11px] font-bold font-mono">
                  2.4°C COLD CHAIN
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[11px]">
                      <th className="py-2">GROUP</th>
                      <th className="py-2">IN STOCK</th>
                      <th className="py-2 text-right">DEPOT STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2.5 font-bold text-slate-800">O+ (Rh Pos)</td>
                      <td className="py-2.5 font-mono">24 Units</td>
                      <td className="py-2.5 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                          • Good
                        </span>
                      </td>
                    </tr>
                    <tr className="bg-rose-50/40">
                      <td className="py-2.5 font-bold text-rose-600">0- (Universal)</td>
                      <td className="py-2.5 font-mono text-rose-700 font-bold">2 Units</td>
                      <td className="py-2.5 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-2xs">
                          • Critical Alert
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold text-slate-800">B+ (Rh Pos)</td>
                      <td className="py-2.5 font-mono">14 Units</td>
                      <td className="py-2.5 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          • Adequate
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold text-slate-800">A+ (Rh Pos)</td>
                      <td className="py-2.5 font-mono">18 Units</td>
                      <td className="py-2.5 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                          • Good
                        </span>
                      </td>
                    </tr>
                    <tr className="bg-rose-50/40">
                      <td className="py-2.5 font-bold text-rose-600">AB- (Rare)</td>
                      <td className="py-2.5 font-mono text-rose-700 font-bold">1 Unit</td>
                      <td className="py-2.5 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-2xs">
                          • Critical
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Next Crossmatch Run: <strong className="text-slate-800">11:30 AM</strong>
                </span>
                <span className="text-teal-700 font-semibold cursor-pointer hover:underline flex items-center gap-0.5">
                  View Full Matrix <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
              </div>
            </div>

            {/* 2. Rapid Requisition Intake */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Rapid Requisition Intake</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Authorize emergency crossmatching or trigger automated city-wide voluntary donor dispatch.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="w-full h-10 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[17px]">add_box</span>
                <span>Create Emergency Blood Requisition</span>
              </button>
              <button
                onClick={() => toast.error('Emergency SMS broadcast dispatched to 142 registered nearby donors')}
                className="w-full h-10 rounded-lg bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[17px]">cell_tower</span>
                <span>Broadcast Voluntary SMS Beacon</span>
              </button>
            </div>

            {/* 3. Donor Directive Protocol #NBTC-09 */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2.5">
              <div className="flex items-center gap-2 text-rose-600">
                <span className="material-symbols-outlined text-lg">shield</span>
                <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  DONOR DIRECTIVE & PROTOCOL #NBTC-09
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Per State Transfusion Safety Board regulations, all voluntary mobile dispatches for negative RH phenotypes must undergo double digital identity verification upon arrival at the central depot reception.
              </p>
              <a
                href="#protocols"
                onClick={(e) => {
                  e.preventDefault();
                  toast('National Blood Transfusion Protocols opened');
                }}
                className="text-xs text-teal-700 font-semibold hover:underline flex items-center gap-1 pt-1"
              >
                <span>Read Emergency Blood Act Protocols</span>
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
            </div>
          </section>
        </div>
      </main>

      {/* EMERGENCY BLOOD REQUISITION MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden my-8">

            <div className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 text-rose-600">
                  <span className="material-symbols-outlined text-2xl">bloodtype</span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Create Emergency Blood Requisition</h3>
                    <p className="text-xs text-slate-500">Real-time Gujarat NBTC Central Depot Telemetry broadcast</p>
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
                      Patient Name / Case ID
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patel / OT Bay 4"
                      value={formData.patient_name}
                      onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Blood Group Required
                    </label>
                    <select
                      value={formData.blood_group}
                      onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-bold text-rose-600 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
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
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Urgency Level
                    </label>
                    <select
                      value={formData.urgency}
                      onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                    >
                      <option value="CRITICAL">CRITICAL (&lt; 30 mins)</option>
                      <option value="URGENT">URGENT (&lt; 2 hrs)</option>
                      <option value="NORMAL">NORMAL (Elective Surgery)</option>
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
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Ahmedabad Area / Coordinates
                    </label>
                    <select
                      value={formData.selectedAreaIndex}
                      onChange={(e) => setFormData({ ...formData, selectedAreaIndex: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                    >
                      {AHMEDABAD_AREAS.map((a, idx) => (
                        <option key={a.name} value={idx}>
                          {a.name} ({a.lat}, {a.lon})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Clinical Notes / Crossmatch
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PRBC crossmatch ready"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-amber-700 shrink-0 mt-0.5">info</span>
                  <span>
                    Submitting will immediately issue an automated geo-fence calculation to identify and notify verified donors within a 10 km radius.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">emergency_share</span>
                    <span>{submitting ? 'Broadcasting...' : 'Authorize & Broadcast Requisition'}</span>
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
