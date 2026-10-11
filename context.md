# MediQueue — AI & Developer System Context

This document provides complete architectural, algorithmic, and programmatic context for AI assistants and developers working on the **MediQueue** codebase.

---

## 1. Domain & Core Purpose
MediQueue is a specialized Healthcare Information System built to solve two critical operational bottlenecks in Indian government and civil hospitals (specifically modeled for **Civil Hospital Ahmedabad — Asarwa Campus**):
1. **OPD Waiting Hall Congestion**: Replacing static ticket counters with dynamic, anti-starvation clinical priority aging and live patient tracking.
2. **Emergency Blood Deficits**: Enabling real-time GPS Haversine donor discovery with strict 90-day donation interval checking and ABO/Rh compatibility rules.

---

## 2. Technology Stack & Topology
- **Frontend**: React 18, Vite, React Router v6, Tailwind CSS v3, Lucide React, Google Material Symbols Outlined.
  - Port: `5173`
  - Design System: Unified Clinical Dark Green (`#00614b` as primary), Slate for ink/typography, Emerald/Teal for operational success, Rose/Amber for clinical triage alerts.
- **Backend**: Node.js, Express, PostgreSQL Client (`pg`), JWT, bcryptjs, Zod schema validation.
  - Port: `5000`
  - Authentication: Stateless Bearer JWT tokens stored in localStorage, verified by `auth.middleware.js`.
- **Database**: PostgreSQL (Neon Cloud Serverless).

---

## 3. Database Schema Overview

### `users`
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR), `email` (VARCHAR UNIQUE), `password_hash` (VARCHAR)
- `role` (ENUM: `'patient'`, `'doctor'`, `'receptionist'`, `'admin'`)
- `age` (INT), `gender` (VARCHAR), `phone` (VARCHAR)
- `blood_group` (VARCHAR: `'A+'`, `'A-'`, `'B+'`, `'B-'`, `'AB+'`, `'AB-'`, `'O+'`, `'O-'`)
- `city` (VARCHAR), `latitude` (DECIMAL), `longitude` (DECIMAL)
- `is_donor` (BOOLEAN DEFAULT false), `last_donation_date` (DATE NULL)

### `doctors`
- `id` (SERIAL PRIMARY KEY), `user_id` (INT REFERENCES users)
- `department_id` (INT REFERENCES departments)
- `room_no` (VARCHAR), `avg_consult_minutes` (INT DEFAULT 10)
- `status` (VARCHAR: `'FREE'`, `'BUSY'`, `'OFFLINE'`)

### `departments`
- `id` (SERIAL PRIMARY KEY), `name` (VARCHAR), `description` (TEXT)

### `appointments`
- `id` (SERIAL PRIMARY KEY)
- `patient_id` (INT REFERENCES users), `doctor_id` (INT REFERENCES doctors), `department_id` (INT REFERENCES departments)
- `appt_date` (DATE), `slot_time` (VARCHAR e.g. `'10:30'`)
- `patient_name_snapshot` (VARCHAR), `age_snapshot` (INT)
- `category` (VARCHAR: `'EMERGENCY'`, `'SENIOR'`, `'GENERAL'`)
- `token_no` (VARCHAR e.g. `'E01'`, `'S03'`, `'G14'`)
- `status` (VARCHAR: `'BOOKED'`, `'CHECKED_IN'`, `'SERVING'`, `'DONE'`, `'CANCELLED'`, `'NO_SHOW'`)
- `skip_count` (INT DEFAULT 0)
- `called_at` (TIMESTAMP NULL), `completed_at` (TIMESTAMP NULL), `created_at` (TIMESTAMP)

### `blood_requests`
- `id` (SERIAL PRIMARY KEY)
- `patient_id` (INT REFERENCES users), `requester_name` (VARCHAR), `phone` (VARCHAR)
- `blood_group` (VARCHAR), `units_needed` (INT)
- `hospital_name` (VARCHAR), `city` (VARCHAR), `latitude` (DECIMAL), `longitude` (DECIMAL)
- `urgency` (VARCHAR: `'CRITICAL'`, `'URGENT'`, `'NORMAL'`)
- `status` (VARCHAR: `'OPEN'`, `'FULFILLED'`, `'CANCELLED'`)

---

## 4. Algorithmic Specifications

### Priority Queue Formula (`priority.service.js`)
To ensure high-acuity patients are seen immediately while avoiding starvation of standard patients, priority scores are computed dynamically:
```javascript
Score = BaseWeight + (skip_count * 10) + (minutesWaited * 0.1)
```
- **Base Weights**:
  - `EMERGENCY`: `100 pts`
  - `SENIOR` (Age ≥ 60 auto-upgrade): `50 pts`
  - `GENERAL`: `10 pts`
- **Skip Rule**: When a newly arrived emergency or senior is called, all existing waiting patients with earlier slot times or check-in timestamps have their `skip_count` incremented by 1 (`+10 pts` boost).
- **Tie-breaker**: Earlier arrival time (`checked_in_at` or `created_at`).

### Token Number Generation (`token.service.js`)
Tokens are generated sequentially per day per category:
- `E01`, `E02`... for Emergency
- `S01`, `S02`... for Senior Citizens
- `G01`, `G02`... for General Outpatients

### LifeLink Compatibility Matrix (`blood.controller.js`)
```javascript
const compatibility = {
  'A+':  ['A+', 'A-', 'O+', 'O-'],
  'A-':  ['A-', 'O-'],
  'B+':  ['B+', 'B-', 'O+', 'O-'],
  'B-':  ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal Recipient
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+':  ['O+', 'O-'],
  'O-':  ['O-'] // Universal Donor
};
```
Donors are filtered by:
1. `blood_group IN compatibleList`
2. `is_donor = true`
3. `(CURRENT_DATE - last_donation_date >= 90 OR last_donation_date IS NULL)`
4. Haversine distance $\le$ search radius.

---

## 5. Key Frontend Workflows

1. **Patient Flow**:
   - Register/Login &rarr; Book Appointment (`/book`) &rarr; Dashboard (`/patient`) with Live Ticket Slip &rarr; Biometric Check-In &rarr; ETA Countdown.
2. **Doctor Flow**:
   - Login as Doctor &rarr; Doctor Console (`/doctor`) &rarr; View Live Queue ranked by priority &rarr; Click **"Call Next Patient"** &rarr; Live Consultation Timer &rarr; Click **"Complete Consultation"**.
3. **Public TV Display (`/live-display`)**:
   - Used on overhead TV monitors in waiting halls. Polls `/api/queue/live` every 5 seconds to show active tokens, chamber numbers, and upcoming series.
4. **Blood Network (`/blood-requests`, `/find-donors`)**:
   - Search compatible voluntary donors using GPS or browse emergency requests.

---

## 6. Design System & Theming Rule
- **Primary Color**: `#00614b` (Clinical Dark Green).
- **Secondary Palette**: Tailored Tailwind `teal` palette maps directly to `#00614b` shades to prevent color divergence.
- **Multilingual Support**: Handled via `LanguageContext` supporting English (`en`), Hindi (`hi`), and Gujarati (`gu`).
- **No Device Mockups**: Render pure web UI. Avoid placeholder images.

---

## 7. Developer Guidelines & Security
- **Never commit `.env`**: Environment variables contain live DB connection strings and JWT secrets.
- **Date Handling**: Use ISO date strings (`YYYY-MM-DD`) when querying appointment dates to prevent timezone slippage.
- **Graceful Error Handling**: Backend controllers wrap queries in `try/catch` and release DB clients in `finally`.
