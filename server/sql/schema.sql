-- =====================================================================
-- MediQueue Database Schema (PostgreSQL)
-- Plain SQL with Primary Keys, Foreign Keys, CHECK constraints, and Indexes
-- =====================================================================

-- 1. Users Table (Role-based access: patient, doctor, receptionist, admin)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  age INT NOT NULL,
  gender VARCHAR(20),
  blood_group VARCHAR(3) CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  role VARCHAR(20) CHECK (role IN ('patient','doctor','receptionist','admin')) DEFAULT 'patient',
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  city VARCHAR(100),
  is_donor BOOLEAN DEFAULT false,
  last_donation_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Hospital Departments (e.g., General OPD, Orthopaedics, ENT, Cardiology)
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

-- 3. Doctors Table (Linked to users table)
CREATE TABLE IF NOT EXISTS doctors (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  department_id INT REFERENCES departments(id) ON DELETE SET NULL,
  room_no VARCHAR(10) NOT NULL,
  avg_consult_minutes INT DEFAULT 10,
  shift_start TIME NOT NULL DEFAULT '09:00:00',
  shift_end TIME NOT NULL DEFAULT '17:00:00',
  status VARCHAR(20) CHECK (status IN ('FREE','BUSY','OFFLINE')) DEFAULT 'OFFLINE'
);

-- 4. Appointments and Queue Tokens
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  patient_id INT REFERENCES users(id) ON DELETE CASCADE,
  doctor_id INT REFERENCES doctors(id) ON DELETE CASCADE,
  department_id INT REFERENCES departments(id) ON DELETE SET NULL,
  appt_date DATE NOT NULL,
  slot_time TIME NULL,
  patient_name_snapshot VARCHAR(100) NOT NULL,
  age_snapshot INT NOT NULL,
  category VARCHAR(20) CHECK (category IN ('EMERGENCY','SENIOR','GENERAL')) NOT NULL,
  token_no VARCHAR(5) NOT NULL, -- e.g. 'E01','S03','G12'
  skip_count INT DEFAULT 0,
  status VARCHAR(20) CHECK (status IN ('BOOKED','CHECKED_IN','SERVING','DONE','NO_SHOW','CANCELLED')) DEFAULT 'BOOKED',
  source VARCHAR(20) CHECK (source IN ('ONLINE','WALKIN')) DEFAULT 'ONLINE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  called_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(appt_date, token_no)
);

-- 5. Daily Token Counters (Atomic serial sequence generation per date & category)
CREATE TABLE IF NOT EXISTS token_counters (
  appt_date DATE NOT NULL,
  category VARCHAR(20) NOT NULL,
  last_number INT NOT NULL DEFAULT 0,
  PRIMARY KEY(appt_date, category)
);

-- 6. Emergency Blood Requests Board
CREATE TABLE IF NOT EXISTS blood_requests (
  id SERIAL PRIMARY KEY,
  requester_id INT REFERENCES users(id) ON DELETE CASCADE,
  patient_name VARCHAR(100) NOT NULL,
  blood_group VARCHAR(3) CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')) NOT NULL,
  units INT NOT NULL DEFAULT 1,
  hospital_name VARCHAR(150) NOT NULL,
  city VARCHAR(100) NOT NULL,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  urgency VARCHAR(20) CHECK (urgency IN ('NORMAL','URGENT','CRITICAL')) DEFAULT 'NORMAL',
  status VARCHAR(20) CHECK (status IN ('OPEN','FULFILLED','CLOSED')) DEFAULT 'OPEN',
  contact_phone VARCHAR(20) NOT NULL,
  needed_by TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Blood Donation Responses
CREATE TABLE IF NOT EXISTS blood_responses (
  id SERIAL PRIMARY KEY,
  request_id INT REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_id INT REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(request_id, donor_id)
);

-- 8. Donor Donation History
CREATE TABLE IF NOT EXISTS donation_history (
  id SERIAL PRIMARY KEY,
  donor_id INT REFERENCES users(id) ON DELETE CASCADE,
  donation_date DATE NOT NULL,
  hospital_name VARCHAR(150) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_doc_date_status ON appointments(doctor_id, appt_date, status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status_group ON blood_requests(status, blood_group);
CREATE INDEX IF NOT EXISTS idx_users_donor_group ON users(is_donor, blood_group);
