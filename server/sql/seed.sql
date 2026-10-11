-- =====================================================================
-- MediQueue Seed Data
-- 4 Departments, 4 Doctors, 1 Admin, 1 Receptionist, 15 Patients,
-- 10 Sample Appointments (with token counters), 3 Blood Requests
-- Password for all accounts is: Password@123
-- Hash: $2a$10$Z.O9kJBD7OK8pX5lrFC/yudhnrceSnrhowu7MRKL8DsqZVKa7fie.
-- =====================================================================

-- Clear tables in reverse dependency order
TRUNCATE TABLE donation_history, blood_responses, blood_requests, appointments, token_counters, doctors, departments, users RESTART IDENTITY CASCADE;

-- 1. DEPARTMENTS
INSERT INTO departments (id, name) VALUES
(1, 'General OPD'),
(2, 'Orthopaedics'),
(3, 'ENT'),
(4, 'Cardiology');

-- 2. USERS (Admin, Receptionist, Doctors, Patients)
-- Password for all: Password@123

-- Admin (ID: 1)
INSERT INTO users (id, name, email, password_hash, phone, age, gender, blood_group, role, latitude, longitude, city, is_donor, last_donation_date)
VALUES (1, 'System Administrator', 'admin@mediqueue.com', '$2a$10$Z.O9kJBD7OK8pX5lrFC/yudhnrceSnrhowu7MRKL8DsqZVKa7fie.', '9876543210', 42, 'Male', 'O+', 'admin', 23.022500, 72.571400, 'Ahmedabad', false, NULL);

-- Receptionist (ID: 2)
INSERT INTO users (id, name, email, password_hash, phone, age, gender, blood_group, role, latitude, longitude, city, is_donor, last_donation_date)
VALUES (2, 'Rekha Joshi', 'reception@mediqueue.com', '$2a$10$Z.O9kJBD7OK8pX5lrFC/yudhnrceSnrhowu7MRKL8DsqZVKa7fie.', '9876543211', 34, 'Female', 'B+', 'receptionist', 23.022500, 72.571400, 'Ahmedabad', false, NULL);

-- Doctors Users (IDs: 3, 4, 5, 6)
INSERT INTO users (id, name, email, password_hash, phone, age, gender, blood_group, role, latitude, longitude, city, is_donor, last_donation_date) VALUES
(3, 'Dr. Rajesh Sharma', 'dr.rajesh@mediqueue.com', '$2a$10$Z.O9kJBD7OK8pX5lrFC/yudhnrceSnrhowu7MRKL8DsqZVKa7fie.', '9876543212', 48, 'Male', 'A+', 'doctor', 23.037300, 72.552400, 'Ahmedabad', true, CURRENT_DATE - INTERVAL '120 days'),
(4, 'Dr. Priya Patel', 'dr.priya@mediqueue.com', '$2a$10$Z.O9kJBD7OK8pX5lrFC/yudhnrceSnrhowu7MRKL8DsqZVKa7fie.', '9876543213', 41, 'Female', 'O-', 'doctor', 23.030400, 72.517800, 'Ahmedabad', true, CURRENT_DATE - INTERVAL '150 days'),
(5, 'Dr. Ankit Mehta', 'dr.ankit@mediqueue.com', '$2a$10$Z.O9kJBD7OK8pX5lrFC/yudhnrceSnrhowu7MRKL8DsqZVKa7fie.', '9876543214', 39, 'Male', 'B-', 'doctor', 23.035000, 72.529300, 'Ahmedabad', false, NULL),
(6, 'Dr. Sunita Rao', 'dr.sunita@mediqueue.com', '$2a$10$Z.O9kJBD7OK8pX5lrFC/yudhnrceSnrhowu7MRKL8DsqZVKa7fie.', '9876543215', 52, 'Female', 'AB+', 'doctor', 23.021000, 72.569000, 'Ahmedabad', true, CURRENT_DATE - INTERVAL '60 days');

-- Patients (IDs: 7 to 21) - 15 Patients (mix of seniors >=60 and general <60, donors and non-donors around Ahmedabad)
INSERT INTO users (id, name, email, password_hash, phone, age, gender, blood_group, role, latitude, longitude, city, is_donor, last_donation_date) VALUES
(7, 'Ramesh Patel', 'ramesh.patel@gmail.com', '$2a$10$Z.O9kJBD7OK8pX5lrFC/yudhnrceSnrhowu7MRKL8DsqZVKa7fie.', '9825011111', 65, 'Male', 'O+', 'patient', 23.037800, 72.552900, 'Ahmedabad', true, CURRENT_DATE - INTERVAL '110 days'),
(8, 'Sarojben Shah', 'saroj.shah@gmail.com', '$2a$10$Z.O9kJBD7OK8pX5lrFC/yudhnrceSnrhowu7MRKL8DsqZVKa7fie.', '9825022222', 71, 'Female', 'A+', 'patient', 23.028900, 72.507400, 'Ahmedabad', false, NULL),
(9, 'Kunal Verma', 'kunal.verma@gmail.com', '$2a$10$Z.O9kJBD7OK8pX5lrFC/yudhnrceSnrhowu7MRKL8DsqZVKa7fie.', '9825033333', 28, 'Male', 'O-', 'patient', 23.035500, 72.528800, 'Ahmedabad', true, CURRENT_DATE - INTERVAL '140 days'),
(10, 'Aayushi Trivedi', 'aayushi.t@gmail.com', '$2a$10$Z.O9kJBD7OK8pX5lrFC/yudhnrceSnrhowu7MRKL8DsqZVKa7fie.', '9825044444', 24, 'Female', 'B+', 'patient', 23.014000, 72.561500, 'Ahmedabad', true, CURRENT_DATE - INTERVAL '45 days'),
(11, 'Bhavesh Dave', 'bhavesh.d@gmail.com', '$2a$10$Z.O9kJBD7OK8pX5lrFC/yudhnrceSnrhowu7MRKL8DsqZVKa7fie.', '9825055555', 62, 'Male', 'A-', 'patient', 23.041000, 72.512000, 'Ahmedabad', true, CURRENT_DATE - INTERVAL '95 days'),
(12, 'Neha Parikh', 'neha.parikh@gmail.com', '$2a$10$Z.O9kJBD7OK8pX5lrFC/yudhnrceSnrhowu7MRKL8DsqZVKa7fie.', '9825066666', 32, 'Female', 'AB-', 'patient', 23.054000, 72.507000, 'Ahmedabad', true, CURRENT_DATE - INTERVAL '180 days'),
(13, 'Vikram Solanki', 'vikram.s@gmail.com', '$2a$10$Z.O9kJBD7OK8pX5lrFC/yudhnrceSnrhowu7MRKL8DsqZVKa7fie.', '9825077777', 45, 'Male', 'O+', 'patient', 22.998000, 72.602500, 'Ahmedabad', true, CURRENT_DATE - INTERVAL '100 days'),
(14, 'Geetaben Prajapati', 'geeta.p@gmail.com', '$2a$10$Z.O9kJBD7OK8pX5lrFC/yudhnrceSnrhowu7MRKL8DsqZVKa7fie.', '9825088888', 68, 'Female', 'B-', 'patient', 23.065000, 72.537000, 'Ahmedabad', false, NULL),
(15, 'Darshan Desai', 'darshan.d@gmail.com', '$2a$10$Z.O9kJBD7OK8pX5lrFC/yudhnrceSnrhowu7MRKL8DsqZVKa7fie.', '9825099999', 35, 'Male', 'B+', 'patient', 23.032000, 72.569500, 'Ahmedabad', true, CURRENT_DATE - INTERVAL '130 days'),
(16, 'Sneha Joshi', 'sneha.j@gmail.com', '$2a$10$Z.O9kJBD7OK8pX5lrFC/yudhnrceSnrhowu7MRKL8DsqZVKa7fie.', '9825100001', 29, 'Female', 'A+', 'patient', 23.038000, 72.551000, 'Ahmedabad', true, CURRENT_DATE - INTERVAL '30 days'),
(17, 'Hasmukhbhai Makwana', 'hasmukh.m@gmail.com', '$2a$10$Z.O9kJBD7OK8pX5lrFC/yudhnrceSnrhowu7MRKL8DsqZVKa7fie.', '9825100002', 74, 'Male', 'O+', 'patient', 23.023000, 72.570000, 'Ahmedabad', false, NULL),
(18, 'Pooja Bhatt', 'pooja.b@gmail.com', '$2a$10$Z.O9kJBD7OK8pX5lrFC/yudhnrceSnrhowu7MRKL8DsqZVKa7fie.', '9825100003', 27, 'Female', 'O-', 'patient', 23.042500, 72.515000, 'Ahmedabad', true, CURRENT_DATE - INTERVAL '160 days'),
(19, 'Jignesh Panchal', 'jignesh.p@gmail.com', '$2a$10$Z.O9kJBD7OK8pX5lrFC/yudhnrceSnrhowu7MRKL8DsqZVKa7fie.', '9825100004', 38, 'Male', 'AB+', 'patient', 23.012500, 72.563000, 'Ahmedabad', true, CURRENT_DATE - INTERVAL '200 days'),
(20, 'Meenaben Barot', 'meena.b@gmail.com', '$2a$10$Z.O9kJBD7OK8pX5lrFC/yudhnrceSnrhowu7MRKL8DsqZVKa7fie.', '9825100005', 61, 'Female', 'A-', 'patient', 23.051000, 72.509000, 'Ahmedabad', false, NULL),
(21, 'Amit Christian', 'amit.c@gmail.com', '$2a$10$Z.O9kJBD7OK8pX5lrFC/yudhnrceSnrhowu7MRKL8DsqZVKa7fie.', '9825100006', 31, 'Male', 'B+', 'patient', 23.036000, 72.531000, 'Ahmedabad', true, CURRENT_DATE - INTERVAL '105 days');

-- Ensure users sequence aligns
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- 3. DOCTORS (4 Doctors mapped to users and departments)
INSERT INTO doctors (id, user_id, department_id, room_no, avg_consult_minutes, shift_start, shift_end, status) VALUES
(1, 3, 1, 'OPD-101', 10, '09:00:00', '17:00:00', 'BUSY'),
(2, 4, 2, 'ORTH-204', 15, '09:00:00', '16:30:00', 'FREE'),
(3, 5, 3, 'ENT-108', 10, '09:30:00', '17:00:00', 'OFFLINE'),
(4, 6, 4, 'CARD-302', 20, '10:00:00', '18:00:00', 'FREE');

SELECT setval('doctors_id_seq', (SELECT MAX(id) FROM doctors));

-- 4. TOKEN COUNTERS FOR TODAY
INSERT INTO token_counters (appt_date, category, last_number) VALUES
(CURRENT_DATE, 'EMERGENCY', 1),
(CURRENT_DATE, 'SENIOR', 3),
(CURRENT_DATE, 'GENERAL', 6);

-- 5. APPOINTMENTS (10 Sample Appointments for today across Doctor 1 & Doctor 2)
-- Token Series: E01 (Emergency), S01-S03 (Senior), G01-G06 (General)
INSERT INTO appointments (
  id, patient_id, doctor_id, department_id, appt_date, slot_time,
  patient_name_snapshot, age_snapshot, category, token_no, skip_count,
  status, source, created_at, checked_in_at, called_at, completed_at
) VALUES
-- Doctor 1 (Dr. Rajesh Sharma, General OPD)
-- 1. Currently Serving patient
(1, 7, 1, 1, CURRENT_DATE, '09:00:00', 'Ramesh Patel', 65, 'SENIOR', 'S01', 0, 'SERVING', 'ONLINE',
 CURRENT_TIMESTAMP - INTERVAL '40 minutes', CURRENT_TIMESTAMP - INTERVAL '30 minutes', CURRENT_TIMESTAMP - INTERVAL '5 minutes', NULL),

-- 2. Emergency Patient (checked in, high priority)
(2, 13, 1, 1, CURRENT_DATE, NULL, 'Vikram Solanki', 45, 'EMERGENCY', 'E01', 0, 'CHECKED_IN', 'WALKIN',
 CURRENT_TIMESTAMP - INTERVAL '25 minutes', CURRENT_TIMESTAMP - INTERVAL '25 minutes', NULL, NULL),

-- 3. Senior Patient (checked in)
(3, 8, 1, 1, CURRENT_DATE, '09:10:00', 'Sarojben Shah', 71, 'SENIOR', 'S02', 0, 'CHECKED_IN', 'ONLINE',
 CURRENT_TIMESTAMP - INTERVAL '35 minutes', CURRENT_TIMESTAMP - INTERVAL '20 minutes', NULL, NULL),

-- 4. General Patient (checked in, skipped once)
(4, 9, 1, 1, CURRENT_DATE, '09:20:00', 'Kunal Verma', 28, 'GENERAL', 'G01', 1, 'CHECKED_IN', 'ONLINE',
 CURRENT_TIMESTAMP - INTERVAL '45 minutes', CURRENT_TIMESTAMP - INTERVAL '25 minutes', NULL, NULL),

-- 5. General Patient (booked, not checked in yet)
(5, 10, 1, 1, CURRENT_DATE, '09:30:00', 'Aayushi Trivedi', 24, 'GENERAL', 'G02', 0, 'BOOKED', 'ONLINE',
 CURRENT_TIMESTAMP - INTERVAL '20 minutes', NULL, NULL, NULL),

-- 6. Senior Patient (booked)
(6, 11, 1, 1, CURRENT_DATE, '09:40:00', 'Bhavesh Dave', 62, 'SENIOR', 'S03', 0, 'BOOKED', 'ONLINE',
 CURRENT_TIMESTAMP - INTERVAL '15 minutes', NULL, NULL, NULL),

-- Doctor 2 (Dr. Priya Patel, Ortho)
-- 7. Done earlier today
(7, 15, 2, 2, CURRENT_DATE, '09:00:00', 'Darshan Desai', 35, 'GENERAL', 'G03', 0, 'DONE', 'ONLINE',
 CURRENT_TIMESTAMP - INTERVAL '60 minutes', CURRENT_TIMESTAMP - INTERVAL '50 minutes', CURRENT_TIMESTAMP - INTERVAL '40 minutes', CURRENT_TIMESTAMP - INTERVAL '25 minutes'),

-- 8. General Patient checked in
(8, 12, 2, 2, CURRENT_DATE, '09:15:00', 'Neha Parikh', 32, 'GENERAL', 'G04', 0, 'CHECKED_IN', 'ONLINE',
 CURRENT_TIMESTAMP - INTERVAL '30 minutes', CURRENT_TIMESTAMP - INTERVAL '15 minutes', NULL, NULL),

-- 9. General Patient booked
(9, 16, 2, 2, CURRENT_DATE, '09:30:00', 'Sneha Joshi', 29, 'GENERAL', 'G05', 0, 'BOOKED', 'ONLINE',
 CURRENT_TIMESTAMP - INTERVAL '15 minutes', NULL, NULL, NULL),

-- 10. General Patient booked
(10, 21, 2, 2, CURRENT_DATE, '09:45:00', 'Amit Christian', 31, 'GENERAL', 'G06', 0, 'BOOKED', 'ONLINE',
 CURRENT_TIMESTAMP - INTERVAL '10 minutes', NULL, NULL, NULL);

SELECT setval('appointments_id_seq', (SELECT MAX(id) FROM appointments));

-- 6. BLOOD REQUESTS (3 Open/Sample Requests)
INSERT INTO blood_requests (
  id, requester_id, patient_name, blood_group, units, hospital_name, city, latitude, longitude,
  urgency, status, contact_phone, needed_by, created_at
) VALUES
(1, 7, 'Kavita Patel', 'O+', 2, 'Civil Hospital, Asarwa', 'Ahmedabad', 23.052500, 72.602600,
 'CRITICAL', 'OPEN', '9825011111', CURRENT_TIMESTAMP + INTERVAL '6 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
(2, 9, 'Mohanlal Verma', 'B+', 3, 'Apollo Hospitals, Bhat', 'Ahmedabad', 23.111800, 72.610500,
 'URGENT', 'OPEN', '9825033333', CURRENT_TIMESTAMP + INTERVAL '12 hours', CURRENT_TIMESTAMP - INTERVAL '4 hours'),
(3, 12, 'Priya Shah', 'AB-', 1, 'Shalby Hospital, SG Highway', 'Ahmedabad', 23.018500, 72.507600,
 'NORMAL', 'OPEN', '9825066666', CURRENT_TIMESTAMP + INTERVAL '24 hours', CURRENT_TIMESTAMP - INTERVAL '6 hours');

SELECT setval('blood_requests_id_seq', (SELECT MAX(id) FROM blood_requests));

-- 7. BLOOD RESPONSES (Sample response to request 1)
INSERT INTO blood_responses (id, request_id, donor_id, message, created_at) VALUES
(1, 1, 13, 'I am in Ahmedabad and can donate by 2 PM.', CURRENT_TIMESTAMP - INTERVAL '1 hour');

SELECT setval('blood_responses_id_seq', (SELECT MAX(id) FROM blood_responses));

-- 8. DONATION HISTORY
INSERT INTO donation_history (id, donor_id, donation_date, hospital_name) VALUES
(1, 7, CURRENT_DATE - INTERVAL '110 days', 'Civil Hospital Ahmedabad'),
(2, 9, CURRENT_DATE - INTERVAL '140 days', 'Apollo Hospital'),
(3, 13, CURRENT_DATE - INTERVAL '100 days', 'Red Cross Society');

SELECT setval('donation_history_id_seq', (SELECT MAX(id) FROM donation_history));
