import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import api from '../../api/axios';

export const LiveDisplay = () => {
  const [displayData, setDisplayData] = useState(null);
  const [clock, setClock] = useState(new Date().toLocaleTimeString());
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [lastAnnouncedToken, setLastAnnouncedToken] = useState(null);
  const [flashChamberId, setFlashChamberId] = useState(null);

  // Synthesize pleasant hospital chime using Web Audio API
  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const playTone = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
      };

      // Hospital Two-Tone Chime: 587.33Hz (D5) -> 880Hz (A5)
      playTone(587.33, 0, 0.4);
      playTone(880, 0.25, 0.6);
    } catch (e) {
      console.warn('Audio chime could not play:', e);
    }
  };

  // Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setClock(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch live display queue from public endpoint
  const fetchDisplay = async () => {
    try {
      const res = await api.get('/queue/display');
      if (res.data?.success) {
        const data = res.data.data;
        setDisplayData(data);

        // Check if any chamber is serving a new token
        data.chambers?.forEach((ch) => {
          if (ch.currentlyServing?.token_no) {
            const token = ch.currentlyServing.token_no;
            if (lastAnnouncedToken && lastAnnouncedToken !== token) {
              setFlashChamberId(ch.doctor_id);
              if (soundEnabled) {
                playChime();
              }
              setTimeout(() => setFlashChamberId(null), 4000);
            }
            setLastAnnouncedToken(token);
          }
        });
      }
    } catch (err) {
      console.error('Failed to fetch live display:', err);
    }
  };

  useEffect(() => {
    fetchDisplay();
    const interval = setInterval(fetchDisplay, 10000);
    return () => clearInterval(interval);
  }, [soundEnabled, lastAnnouncedToken]);

  // Fallback mock chambers if database has no active consultations yet today
  const chambers = displayData?.chambers?.length
    ? displayData.chambers
    : [
        {
          doctor_id: 1,
          doctor_name: 'Dr. Ananya Sharma',
          department_name: 'Cardiology',
          room_no: '104',
          doctor_status: 'BUSY',
          currentlyServing: {
            token_no: 'E02',
            category: 'EMERGENCY',
            patient_name: 'Rajeshwar Varma',
          },
          nextWaiting: [
            { token_no: 'S04', category: 'SENIOR' },
            { token_no: 'E03', category: 'EMERGENCY' },
            { token_no: 'G15', category: 'GENERAL' },
            { token_no: 'G16', category: 'GENERAL' },
          ],
          totalWaiting: 4,
        },
        {
          doctor_id: 2,
          doctor_name: 'Dr. Vikram Sethi',
          department_name: 'Orthopaedics',
          room_no: '105',
          doctor_status: 'BUSY',
          currentlyServing: {
            token_no: 'S01',
            category: 'SENIOR',
            patient_name: 'Narmadaben Patel',
          },
          nextWaiting: [
            { token_no: 'S02', category: 'SENIOR' },
            { token_no: 'G03', category: 'GENERAL' },
            { token_no: 'G04', category: 'GENERAL' },
          ],
          totalWaiting: 3,
        },
        {
          doctor_id: 3,
          doctor_name: 'Dr. Rajesh Patel',
          department_name: 'ENT',
          room_no: '102',
          doctor_status: 'FREE',
          currentlyServing: null,
          nextWaiting: [
            { token_no: 'G05', category: 'GENERAL' },
            { token_no: 'G06', category: 'GENERAL' },
          ],
          totalWaiting: 2,
        },
        {
          doctor_id: 4,
          doctor_name: 'Dr. Sneha Kulkarni',
          department_name: 'General Medicine',
          room_no: '101',
          doctor_status: 'BUSY',
          currentlyServing: {
            token_no: 'G01',
            category: 'GENERAL',
            patient_name: 'Vikram Joshi',
          },
          nextWaiting: [
            { token_no: 'G07', category: 'GENERAL' },
            { token_no: 'S07', category: 'SENIOR' },
          ],
          totalWaiting: 2,
        },
      ];

  const totalWaitingCount = chambers.reduce((acc, c) => acc + (c.totalWaiting || 0), 0);
  const activeServingCount = chambers.filter((c) => c.currentlyServing).length;

  return (
    <div className="min-h-screen bg-[#082019] text-white flex flex-col justify-between selection:bg-teal-500 selection:text-white select-none">
      {/* TOP HEADER */}
      <header className="px-6 lg:px-10 py-4 bg-[#051712] border-b border-teal-900/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src="/logo.png"
            alt="MediQueue Logo"
            className="w-12 h-12 rounded-xl object-contain bg-white p-1 shadow-md border border-teal-500/30"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl lg:text-2xl tracking-tight uppercase">
                MEDI<span className="text-teal-400">QUEUE</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-900/80 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
                LIVE WAITING HALL TV
              </span>
            </div>
            <p className="text-xs text-teal-200/80 font-medium mt-0.5">
              Civil Hospital Ahmedabad — Asarwa Campus • New OPD Block Ground Floor
            </p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playChime();
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? 'bg-teal-600 border-teal-500 text-white shadow-sm'
                : 'bg-white/5 border-white/20 text-slate-300 hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {soundEnabled ? 'volume_up' : 'volume_off'}
            </span>
            <span>{soundEnabled ? 'Audio Chime ON' : 'Audio Chime OFF'}</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-teal-500/20 rounded-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-mono font-bold text-teal-300">
              TELEMETRY: LIVE
            </span>
          </div>

          <div className="font-mono text-xl lg:text-2xl font-black bg-black/60 px-4 py-1.5 rounded-xl border border-teal-500/30 text-white tabular-nums tracking-wide shadow-inner">
            {clock}
          </div>
        </div>
      </header>

      {/* ANNOUNCEMENT BANNER */}
      <div className="bg-teal-950/90 border-b border-teal-800/50 px-6 py-2.5 flex items-center justify-between text-xs font-semibold overflow-hidden">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-amber-400 uppercase font-bold tracking-wider">
            <span className="material-symbols-outlined text-base animate-pulse">campaign</span>
            Announcement:
          </span>
          <span className="text-slate-200 font-medium">
            Please proceed immediately to the respective chamber door when your token is summoned. Senior citizens have priority ramp access at Wing B.
          </span>
        </div>
        <div className="hidden md:flex items-center gap-3 font-mono text-[11px] text-teal-300">
          <span>Active Chambers: {activeServingCount}</span>
          <span>•</span>
          <span>Waiting in Hall: {totalWaitingCount}</span>
        </div>
      </div>

      {/* MAIN 4-CHAMBER 16:9 GRID */}
      <main className="flex-1 p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
        {chambers.map((chamber) => {
          const serving = chamber.currentlyServing;
          const isFlashing = flashChamberId === chamber.doctor_id;
          const isEmergency = serving?.category === 'EMERGENCY';
          const isSenior = serving?.category === 'SENIOR';

          return (
            <div
              key={chamber.doctor_id}
              className={`bg-[#0c2e24] border-2 rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 ${
                isFlashing
                  ? 'border-amber-400 ring-4 ring-amber-400/40 scale-[1.02]'
                  : 'border-teal-800/80 hover:border-teal-600'
              }`}
            >
              {/* Chamber Header */}
              <div className="bg-[#051712] p-4 border-b border-teal-900 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-lg text-white">
                      ROOM {chamber.room_no}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        chamber.doctor_status === 'BUSY' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'
                      }`}
                    ></span>
                  </div>
                  <p className="text-xs text-teal-300 font-semibold">{chamber.department_name} OPD</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-300 block">{chamber.doctor_name}</span>
                  <span className="text-[10px] text-teal-400 uppercase font-mono tracking-wider">
                    {chamber.doctor_status === 'BUSY' ? 'IN SESSION' : 'FREE / READY'}
                  </span>
                </div>
              </div>

              {/* CURRENTLY SERVING HERO TICKET */}
              <div className="p-6 flex flex-col items-center justify-center text-center my-auto">
                <span className="text-xs uppercase font-extrabold tracking-widest text-teal-300 mb-2">
                  NOW SERVING
                </span>

                {serving ? (
                  <>
                    <div
                      className={`w-36 h-36 rounded-3xl flex flex-col items-center justify-center shadow-2xl border-4 transition-transform ${
                        isEmergency
                          ? 'bg-rose-600 border-rose-400 text-white animate-pulse'
                          : isSenior
                          ? 'bg-amber-500 border-amber-300 text-slate-950'
                          : 'bg-teal-600 border-teal-300 text-white'
                      }`}
                    >
                      <span className="font-mono text-5xl font-black tracking-tight leading-none">
                        {serving.token_no}
                      </span>
                      <span
                        className={`text-[11px] font-extrabold tracking-widest uppercase mt-1 ${
                          isSenior ? 'text-amber-950' : 'text-white/90'
                        }`}
                      >
                        {serving.category}
                      </span>
                    </div>

                    <div className="mt-3">
                      <span className="text-sm font-bold text-white block">
                        {serving.patient_name || 'Patient in Chamber'}
                      </span>
                      <span className="text-xs text-teal-200/80">
                        Proceed to Door {chamber.room_no}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="w-36 h-36 rounded-3xl bg-black/30 border-2 border-dashed border-teal-800 flex flex-col items-center justify-center text-teal-400">
                    <span className="material-symbols-outlined text-4xl mb-1 opacity-60">
                      hourglass_empty
                    </span>
                    <span className="text-xs font-bold tracking-wider uppercase">Chamber Open</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Calling next...</span>
                  </div>
                )}
              </div>

              {/* NEXT 4-5 TOKENS STRIP */}
              <div className="p-4 bg-[#061c16] border-t border-teal-900/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400 uppercase tracking-wider text-[10px]">
                    NEXT IN QUEUE
                  </span>
                  <span className="text-teal-400 font-mono text-[11px]">
                    {chamber.totalWaiting || 0} waiting
                  </span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {chamber.nextWaiting && chamber.nextWaiting.length > 0 ? (
                    chamber.nextWaiting.slice(0, 4).map((w, idx) => {
                      const isE = w.category === 'EMERGENCY';
                      const isS = w.category === 'SENIOR';
                      return (
                        <div
                          key={idx}
                          className={`flex-1 min-w-[54px] py-1.5 px-2 rounded-lg text-center font-mono font-bold text-xs border ${
                            isE
                              ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                              : isS
                              ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                              : 'bg-teal-950/80 border-teal-700 text-teal-300'
                          }`}
                        >
                          <span className="block leading-none">{w.token_no}</span>
                          <span className="text-[8px] font-sans uppercase opacity-80 mt-0.5 block">
                            {isE ? 'Emg' : isS ? 'Sen' : 'Gen'}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="w-full text-center py-2 text-xs text-slate-500">
                      Queue clear
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* FOOTER TICKER */}
      <footer className="px-6 py-3 bg-[#051712] border-t border-teal-900/60 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-400"></span>
          <span>Emergency Triage Line (Prefix E) summons instantly ahead of routine consultations.</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-teal-400 font-semibold">Real-Time Clinical Queue Broadcast</span>
        </div>
      </footer>
    </div>
  );
};

export default LiveDisplay;
