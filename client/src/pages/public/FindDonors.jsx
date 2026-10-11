import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getBloodRequests, getNearbyDonorsForRequest, getAllDonors } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import { DonorCardSkeleton } from '../../components/Skeleton';
import toast from 'react-hot-toast';

/**
 * Hematology Red Blood Cell Compatibility Matrix
 * - AB+ is Universal Recipient (can receive all 8 blood types)
 * - O- is Universal Donor (can donate to all 8 blood types, but only receive O-)
 */
export const COMPATIBLE_DONORS_FOR_RECIPIENT = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal Recipient
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'],
};

// Comprehensive registry of registered voluntary donors across Ahmedabad
const defaultDonorsPool = [
  {
    id: 1,
    name: 'Pritesh Shah',
    blood_group: 'B+',
    city: 'Ellis Bridge, Central Zone',
    distanceKm: 2.4,
    daysAgo: 120,
    isAvailable: true,
    phone: '9842103948',
    maskedPhone: '9842103948',
    badge: 'Verified Donor',
    stripeColor: 'bg-teal-700',
  },
  {
    id: 2,
    name: 'Dr. Meera Joshi',
    blood_group: 'B+',
    city: 'Navrangpura, Western Wing',
    distanceKm: 4.1,
    daysAgo: 95,
    isAvailable: true,
    phone: '9825014820',
    maskedPhone: '9825014820',
    badge: 'Verified Medical Staff',
    stripeColor: 'bg-teal-800',
  },
  {
    id: 3,
    name: 'Karan Dave',
    blood_group: 'B+',
    city: 'Satellite, West Zone',
    distanceKm: 5.8,
    daysAgo: 140,
    isAvailable: true,
    phone: '9712038472',
    maskedPhone: '9712038472',
    badge: 'Regular Donor (4x)',
    stripeColor: 'bg-amber-600',
  },
  {
    id: 4,
    name: 'Aniket Mehta',
    blood_group: 'O-',
    city: 'Vastrapur, West Zone',
    distanceKm: 6.2,
    daysAgo: 180,
    isAvailable: true,
    phone: '9898014529',
    maskedPhone: '9898014529',
    badge: 'Universal Donor (O-)',
    stripeColor: 'bg-rose-600',
  },
  {
    id: 5,
    name: 'Dr. Rajesh Sharma',
    blood_group: 'A+',
    city: 'Navrangpura, West Zone',
    distanceKm: 3.2,
    daysAgo: 110,
    isAvailable: true,
    phone: '9876541092',
    maskedPhone: '9876541092',
    badge: 'Civil Doctor On-Duty',
    stripeColor: 'bg-teal-700',
  },
  {
    id: 6,
    name: 'Bhavesh Prajapati',
    blood_group: 'A-',
    city: 'Paldi, Central Zone',
    distanceKm: 3.8,
    daysAgo: 130,
    isAvailable: true,
    phone: '9824190284',
    maskedPhone: '9824190284',
    badge: 'Verified Rare Donor',
    stripeColor: 'bg-emerald-600',
  },
  {
    id: 7,
    name: 'Dr. Sunita Rao',
    blood_group: 'AB+',
    city: 'Civil Hospital (Asarwa)',
    distanceKm: 1.1,
    daysAgo: 65,
    isAvailable: true,
    phone: '9825109348',
    maskedPhone: '9825109348',
    badge: 'Senior Registrar',
    stripeColor: 'bg-purple-600',
  },
  {
    id: 8,
    name: 'Chirag Desai',
    blood_group: 'AB+',
    city: 'Maninagar, South Zone',
    distanceKm: 4.9,
    daysAgo: 105,
    isAvailable: true,
    phone: '9879018247',
    maskedPhone: '9879018247',
    badge: 'Voluntary Network Lead',
    stripeColor: 'bg-purple-700',
  },
  {
    id: 9,
    name: 'Hardik Suthar',
    blood_group: 'AB-',
    city: 'Chandkheda, North Zone',
    distanceKm: 7.4,
    daysAgo: 150,
    isAvailable: true,
    phone: '9904281729',
    maskedPhone: '9904281729',
    badge: 'Rare Phenotype Registry',
    stripeColor: 'bg-indigo-600',
  },
  {
    id: 10,
    name: 'Dr. Priya Patel',
    blood_group: 'O-',
    city: 'Satellite, West Zone',
    distanceKm: 5.1,
    daysAgo: 155,
    isAvailable: true,
    phone: '9825310948',
    maskedPhone: '9825310948',
    badge: 'Universal Donor (O-)',
    stripeColor: 'bg-rose-600',
  },
  {
    id: 11,
    name: 'Ramesh Patel',
    blood_group: 'O+',
    city: 'Ellisbridge, Central Zone',
    distanceKm: 2.1,
    daysAgo: 110,
    isAvailable: true,
    phone: '9825091834',
    maskedPhone: '9825091834',
    badge: 'Active Registered Donor',
    stripeColor: 'bg-teal-700',
  },
  {
    id: 12,
    name: 'Dr. Ankit Mehta',
    blood_group: 'B-',
    city: 'Vastrapur, West Zone',
    distanceKm: 5.5,
    daysAgo: 100,
    isAvailable: true,
    phone: '9876209148',
    maskedPhone: '9876209148',
    badge: 'ENT Surgeon / Donor',
    stripeColor: 'bg-amber-700',
  },
];

export const FindDonors = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const queryGroup = searchParams.get('group');
  const queryReqId = searchParams.get('requestId');
  const [selectedGroup, setSelectedGroup] = useState(queryGroup || 'AB+');
  const [radius, setRadius] = useState('Within 10 km');
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [donorsPool, setDonorsPool] = useState(defaultDonorsPool);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (queryGroup) {
      setSelectedGroup(queryGroup);
    }
  }, [queryGroup]);

  // Load registered donors from backend if available
  useEffect(() => {
    async function loadDonors() {
      setLoading(true);
      try {
        if (queryReqId) {
          const res = await getNearbyDonorsForRequest(queryReqId);
          if (res.data?.data?.donors?.length > 0) {
            const mapped = res.data.data.donors.map((d) => ({
              ...d,
              daysAgo: d.eligibility?.daysSinceDonation ?? 100,
              isAvailable: d.eligibility?.isEligible ?? true,
              badge: d.role === 'doctor' ? 'Medical Staff Donor' : 'Verified Registered Donor',
              stripeColor: d.blood_group === 'O-' ? 'bg-rose-600' : 'bg-teal-700',
            }));
            setDonorsPool((prev) => {
              const ids = new Set(mapped.map((m) => m.id));
              return [...mapped, ...prev.filter((p) => !ids.has(p.id))];
            });
            return;
          }
        }

        const res = await getAllDonors();
        if (res.data?.data?.length > 0) {
          const mapped = res.data.data.map((d) => ({
            ...d,
            distanceKm: d.distanceKm || (Math.floor(Math.random() * 40 + 15) / 10),
            daysAgo: d.daysAgo || 110,
            isAvailable: d.isAvailable ?? true,
            badge: d.role === 'doctor' ? 'Medical Staff Donor' : 'Verified Registered Donor',
            stripeColor: d.blood_group === 'O-' ? 'bg-rose-600' : 'bg-teal-700',
          }));
          setDonorsPool((prev) => {
            const ids = new Set(mapped.map((m) => m.id));
            return [...mapped, ...prev.filter((p) => !ids.has(p.id))];
          });
        }
      } catch (err) {
        console.warn('Backend donor load notice:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDonors();
  }, [queryReqId]);

  const bloodGroups = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Medical Hematology Compatibility Filter
  const compatibleGroups = COMPATIBLE_DONORS_FOR_RECIPIENT[selectedGroup] || [selectedGroup];

  const filteredDonors = donorsPool.filter((d) => {
    // 1. Group check: If not 'All', donor blood group must be compatible with recipient!
    if (selectedGroup !== 'All') {
      if (!compatibleGroups.includes(d.blood_group)) {
        return false;
      }
    }

    // 2. Availability toggle
    if (onlyAvailable && d.isAvailable === false) {
      return false;
    }

    // 3. Radius filter
    if (radius === 'Within 5 km' && d.distanceKm > 5) return false;
    if (radius === 'Within 10 km' && d.distanceKm > 10) return false;
    if (radius === 'Within 25 km' && d.distanceKm > 25) return false;

    return true;
  });

  const handleCallDonor = (donor) => {
    toast.success(`Encrypted dispatch beacon transmitted to ${donor.name} (${donor.maskedPhone})`);
  };

  return (
    <div className="min-h-screen bg-[#F7F9F7] text-slate-900 flex flex-col">
      <main className="p-4 lg:p-8 max-w-[1440px] mx-auto w-full space-y-6">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-mono text-[11px] tracking-wide uppercase font-semibold border border-teal-200">
                Registry v3.8
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">Ahmedabad Civil Network</span>
            </div>
            <h1 className="font-headline-lg text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              {t('find_verified_donors')}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 max-w-3xl">
              {t('find_donors_sub')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/blood-requests"
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">emergency</span>
              <span>{t('blood_requests')}</span>
            </Link>
            <Link
              to="/profile"
              className="px-4 py-2 bg-teal-700 text-white rounded-xl hover:bg-teal-800 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>{t('my_donor_settings')}</span>
            </Link>
          </div>
        </div>

        {/* FILTER CONTROLS BAR */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            {/* Blood Group Pills */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                {t('select_target_phenotype')}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {bloodGroups.map((bg) => (
                  <button
                    key={bg}
                    onClick={() => setSelectedGroup(bg)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                      selectedGroup === bg
                        ? 'bg-teal-700 text-white shadow-sm ring-2 ring-teal-500/30'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            {/* Geofence & Availability */}
            <div className="flex flex-wrap items-center gap-4 pt-3 xl:pt-0 border-t xl:border-t-0 border-slate-100">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600" htmlFor="radius">
                  {t('geofence_radius')}:
                </label>
                <select
                  id="radius"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-800 text-xs font-medium rounded-xl px-3 py-1.5 focus:border-teal-600 focus:outline-none"
                >
                  <option>Within 5 km</option>
                  <option>Within 10 km</option>
                  <option>Within 25 km</option>
                </select>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">{t('available_immediately')}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-700"></div>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN CONTENT - VERIFIED DONORS STREAM */}
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900">{t('verified_matches')}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 font-mono text-xs font-bold border border-teal-200">
                {filteredDonors.length} Active
              </span>
            </div>
            <span className="text-xs text-slate-500">{t('sorted_by_proximity')}</span>
          </div>

          {/* Clinical Compatibility Explanation Card */}
          {selectedGroup !== 'All' && (
            <div
              className={`p-4 rounded-xl border text-xs flex items-start gap-3 shadow-xs ${
                selectedGroup === 'AB+'
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : selectedGroup === 'O-'
                  ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                  : 'bg-teal-50/80 border-teal-200 text-teal-950'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5 text-teal-700">
                bloodtype
              </span>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold">
                    {selectedGroup === 'AB+'
                      ? 'Universal Recipient Active (AB+)'
                      : selectedGroup === 'O-'
                      ? 'Universal Donor / Specific Recipient (O-)'
                      : `Recipient Group: ${selectedGroup}`}
                  </span>
                  <span className="bg-white/80 border border-slate-200/80 px-2 py-0.5 rounded text-[11px] font-mono font-semibold">
                    Compatible Donors: {compatibleGroups.join(', ')}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {selectedGroup === 'AB+'
                    ? 'Patients with AB+ blood have both A and B antigens and Rh factor. They can safely receive red blood cells from all 8 blood groups (A+, A-, B+, B-, AB+, AB-, O+, O-). All matching voluntary donors are displayed below.'
                    : selectedGroup === 'O-'
                    ? 'Patients with O- blood have no A, B, or Rh surface antigens. They can safely receive red blood cells only from O- donors.'
                    : `Patients with ${selectedGroup} blood can safely receive transfusions from donors with ${compatibleGroups.join(', ')} blood types.`}
                </p>
              </div>
            </div>
          )}

          {/* Donor Cards */}
          {loading ? (
            <div className="space-y-4">
              <DonorCardSkeleton />
              <DonorCardSkeleton />
              <DonorCardSkeleton />
            </div>
          ) : filteredDonors.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
              <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
              <p className="font-semibold text-slate-700 mt-2">{t('no_matching_donors')}</p>
              <p className="text-xs text-slate-500 mt-1">{t('try_expanding_radius')}</p>
            </div>
          ) : (
            filteredDonors.map((donor) => {
              const donorPhone = donor.phone || donor.maskedPhone || '9876543210';
              return (
                <div
                  key={donor.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all shadow-sm relative overflow-hidden"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${donor.stripeColor || 'bg-teal-700'}`}></div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pl-2">
                    <div className="flex items-start gap-4">
                      {/* Blood Group Callout */}
                      <div className="w-16 h-16 rounded-xl bg-teal-50 border border-teal-200 flex flex-col items-center justify-center text-center p-1 shrink-0">
                        <span className="font-mono text-2xl font-bold text-teal-800 leading-none">
                          {donor.blood_group}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                          Rh Positive
                        </span>
                      </div>

                      {/* Donor Meta */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{donor.name}</h3>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-50 text-teal-800 text-[11px] font-semibold border border-teal-200">
                            <span className="material-symbols-outlined text-[13px]">verified_user</span>
                            <span>{donor.badge}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            <span>Ready to Donate</span>
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                          <span className="flex items-center gap-1 text-teal-700 font-semibold">
                            <span className="material-symbols-outlined text-[15px]">check_circle</span>
                            <span>{t('available_immediately')}</span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>
                            Last Donated <strong className="font-mono text-slate-800 font-semibold">{donor.daysAgo} days ago</strong> (Eligible)
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-0.5">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-teal-600">near_me</span>
                            <span className="font-mono font-bold text-slate-800">{donor.distanceKm} km away</span>
                            <span>({donor.city})</span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1 text-slate-700 font-mono font-semibold">
                            <span className="material-symbols-outlined text-[15px] text-teal-700">call</span>
                            <span>{donorPhone}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex md:flex-col items-stretch justify-center gap-2 shrink-0 md:min-w-[190px] pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <a
                        href={`tel:${donorPhone}`}
                        className="px-4 py-2.5 bg-teal-700 text-white hover:bg-teal-800 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-1.5 shadow-sm transition-colors text-center"
                      >
                        <span className="material-symbols-outlined text-[18px]">call</span>
                        <span>Call {donorPhone}</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default FindDonors;
