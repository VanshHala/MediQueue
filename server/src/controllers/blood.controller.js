import { query } from '../config/db.js';
import {
  AHMEDABAD_AREAS,
  calculateDistanceKm,
  COMPATIBLE_DONORS_FOR_RECIPIENT,
  maskPhoneNumber,
  checkDonorEligibility,
} from '../services/haversine.service.js';

/**
 * GET /api/blood/donor-profile
 * Get authenticated user's blood donor profile & eligibility
 */
export const getDonorProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { rows } = await query(
      `SELECT id, name, email, phone, age, gender, blood_group, city, latitude, longitude,
              is_donor, last_donation_date, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const user = rows[0];
    const eligibility = checkDonorEligibility(user.last_donation_date);

    // Get donor's historical donation counts
    const historyRes = await query(
      `SELECT COUNT(*)::int AS total_donations
       FROM donation_history WHERE donor_id = $1`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: {
        ...user,
        eligibility,
        totalDonations: historyRes.rows[0]?.total_donations || 0,
        availableAreas: Object.keys(AHMEDABAD_AREAS),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/blood/donor-profile
 * Update authenticated user's blood donor registration
 */
export const updateDonorProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { is_donor, blood_group, last_donation_date, city, latitude, longitude } = req.body;

    let targetLat = latitude;
    let targetLng = longitude;

    // If city/area is one of our predefined Ahmedabad areas, resolve coords
    if (city && AHMEDABAD_AREAS[city]) {
      targetLat = AHMEDABAD_AREAS[city].lat;
      targetLng = AHMEDABAD_AREAS[city].lng;
    }

    const { rows } = await query(
      `UPDATE users
       SET is_donor = COALESCE($1, is_donor),
           blood_group = COALESCE($2, blood_group),
           last_donation_date = COALESCE($3, last_donation_date),
           city = COALESCE($4, city),
           latitude = COALESCE($5, latitude),
           longitude = COALESCE($6, longitude)
       WHERE id = $7
       RETURNING id, name, email, phone, blood_group, city, latitude, longitude, is_donor, last_donation_date`,
      [is_donor, blood_group, last_donation_date || null, city, targetLat, targetLng, userId]
    );

    const updated = rows[0];
    const eligibility = checkDonorEligibility(updated.last_donation_date);

    res.status(200).json({
      success: true,
      message: 'Donor profile updated successfully',
      data: {
        ...updated,
        eligibility,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/blood/donors
 * List active registered blood donors with optional recipient compatibility filtering
 */
export const getAllDonors = async (req, res, next) => {
  try {
    const { recipient_group, blood_group } = req.query;
    let compatibleGroups = null;

    if (recipient_group && COMPATIBLE_DONORS_FOR_RECIPIENT[recipient_group]) {
      compatibleGroups = COMPATIBLE_DONORS_FOR_RECIPIENT[recipient_group];
    } else if (blood_group && blood_group !== 'All') {
      compatibleGroups = COMPATIBLE_DONORS_FOR_RECIPIENT[blood_group] || [blood_group];
    }

    let queryText = `
      SELECT id, name, blood_group, city, latitude, longitude,
             last_donation_date, phone, role
      FROM users
      WHERE is_donor = true
    `;
    const params = [];

    if (compatibleGroups && compatibleGroups.length > 0) {
      params.push(compatibleGroups);
      queryText += ` AND blood_group = ANY($${params.length}::varchar[])`;
    }

    queryText += ` ORDER BY name ASC`;

    const { rows: donors } = await query(queryText, params);

    const scored = donors.map((d) => {
      const eligibility = checkDonorEligibility(d.last_donation_date);
      const maskedPhone = maskPhoneNumber(d.phone);
      return {
        id: d.id,
        name: d.name,
        blood_group: d.blood_group,
        city: d.city || 'Ahmedabad',
        eligibility,
        maskedPhone,
        role: d.role,
        isAvailable: eligibility.isEligible,
        daysAgo: eligibility.daysSinceDonation ?? 120,
      };
    });

    res.status(200).json({
      success: true,
      data: scored,
      compatibleGroups,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/blood/requests
 * Create an emergency or routine blood requisition
 */
export const createBloodRequest = async (req, res, next) => {
  try {
    const requesterId = req.user.id;
    const {
      patient_name,
      blood_group,
      units_needed,
      units_required,
      units,
      hospital_name = 'Civil Hospital Ahmedabad',
      city = 'Civil Hospital (Asarwa)',
      urgency = 'NORMAL', // 'NORMAL' | 'URGENT' | 'CRITICAL'
      contact_phone,
      needed_by,
      latitude,
      longitude,
    } = req.body;

    const finalUnits = Number(units_required || units_needed || units) || 1;
    const finalPatientName = patient_name || req.user.name || 'Emergency Trauma Patient';

    let targetLat = latitude;
    let targetLng = longitude;

    if (city && AHMEDABAD_AREAS[city]) {
      targetLat = AHMEDABAD_AREAS[city].lat;
      targetLng = AHMEDABAD_AREAS[city].lng;
    } else if (!targetLat || !targetLng) {
      targetLat = AHMEDABAD_AREAS['Civil Hospital (Asarwa)'].lat;
      targetLng = AHMEDABAD_AREAS['Civil Hospital (Asarwa)'].lng;
    }

    const { rows } = await query(
      `INSERT INTO blood_requests
        (requester_id, patient_name, blood_group, units, hospital_name, city, latitude, longitude, urgency, status, contact_phone, needed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'OPEN', $10, $11)
       RETURNING *, units AS units_required, units AS units_needed`,
      [
        requesterId,
        finalPatientName,
        blood_group,
        finalUnits,
        hospital_name,
        city,
        targetLat,
        targetLng,
        urgency,
        contact_phone || req.user.phone || '9876543210',
        needed_by || null,
      ]
    );

    const newReq = rows[0];

    res.status(201).json({
      success: true,
      message: `Emergency requisition #${newReq.id} for ${blood_group} created successfully`,
      data: newReq,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/blood/requests
 * List public or filtered active blood requisitions
 */
export const getBloodRequests = async (req, res, next) => {
  try {
    const { status = 'OPEN', blood_group, urgency } = req.query;

    let queryText = `
      SELECT br.*, br.units AS units_required, br.units AS units_needed, u.name AS requester_name,
             (SELECT COUNT(*) FROM blood_responses WHERE request_id = br.id)::int AS responses_count
      FROM blood_requests br
      JOIN users u ON br.requester_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      queryText += ` AND br.status = $${params.length}`;
    }

    if (blood_group) {
      params.push(blood_group);
      queryText += ` AND br.blood_group = $${params.length}`;
    }

    if (urgency) {
      params.push(urgency);
      queryText += ` AND br.urgency = $${params.length}`;
    }

    queryText += `
      ORDER BY
        CASE
          WHEN br.urgency = 'CRITICAL' THEN 1
          WHEN br.urgency = 'URGENT' THEN 2
          ELSE 3
        END,
        br.created_at DESC
    `;

    const { rows } = await query(queryText, params);

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/blood/requests/:id
 * Get single blood requisition details
 */
export const getBloodRequestById = async (req, res, next) => {
  try {
    const reqId = req.params.id;

    const { rows } = await query(
      `SELECT br.*, u.name AS requester_name, u.email AS requester_email
       FROM blood_requests br
       JOIN users u ON br.requester_id = u.id
       WHERE br.id = $1`,
      [reqId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Requisition not found' });
    }

    const bloodReq = rows[0];

    // Get donor commitments
    const { rows: responses } = await query(
      `SELECT brsp.*, u.name AS donor_name, u.phone AS donor_phone, u.blood_group AS donor_blood_group
       FROM blood_responses brsp
       JOIN users u ON brsp.donor_id = u.id
       WHERE brsp.request_id = $1
       ORDER BY brsp.created_at DESC`,
      [reqId]
    );

    res.status(200).json({
      success: true,
      data: {
        ...bloodReq,
        responses,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/blood/requests/:id/donors
 * Find nearby eligible donors sorted by Haversine distance in km
 */
export const getNearbyDonorsForRequest = async (req, res, next) => {
  try {
    const reqId = req.params.id;

    const reqRes = await query(`SELECT * FROM blood_requests WHERE id = $1`, [reqId]);
    if (reqRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Blood request not found' });
    }

    const targetReq = reqRes.rows[0];
    const compatibleGroups =
      COMPATIBLE_DONORS_FOR_RECIPIENT[targetReq.blood_group] || [targetReq.blood_group];

    // Query active registered donors whose blood group is compatible
    const { rows: donors } = await query(
      `SELECT id, name, blood_group, city, latitude, longitude,
              last_donation_date, phone, role
       FROM users
       WHERE is_donor = true AND blood_group = ANY($1::varchar[])`,
      [compatibleGroups]
    );

    const reqLat = parseFloat(targetReq.latitude) || 23.0526;
    const reqLng = parseFloat(targetReq.longitude) || 72.5938;

    // Calculate Haversine distance, mask phone number, and evaluate eligibility
    const scoredDonors = donors.map((d) => {
      const donorLat = parseFloat(d.latitude) || (AHMEDABAD_AREAS[d.city]?.lat ?? 23.0365);
      const donorLng = parseFloat(d.longitude) || (AHMEDABAD_AREAS[d.city]?.lng ?? 72.5611);

      const distanceKm = calculateDistanceKm(reqLat, reqLng, donorLat, donorLng);
      const eligibility = checkDonorEligibility(d.last_donation_date);
      const maskedPhone = maskPhoneNumber(d.phone);

      return {
        id: d.id,
        name: d.name,
        blood_group: d.blood_group,
        city: d.city || 'Ahmedabad',
        distanceKm,
        eligibility,
        maskedPhone,
        role: d.role,
      };
    });

    // Sort by proximity: closest donors first
    scoredDonors.sort((a, b) => a.distanceKm - b.distanceKm);

    res.status(200).json({
      success: true,
      data: {
        request: targetReq,
        compatibleGroups,
        totalFound: scoredDonors.length,
        donors: scoredDonors,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/blood/requests/:id/respond
 * Registered donor commits to donate
 */
export const respondToBloodRequest = async (req, res, next) => {
  try {
    const reqId = req.params.id;
    const donorId = req.user.id;
    const { message = 'I am nearby and can donate.' } = req.body;

    const { rows } = await query(
      `INSERT INTO blood_responses (request_id, donor_id, message)
       VALUES ($1, $2, $3)
       ON CONFLICT (request_id, donor_id)
       DO UPDATE SET message = EXCLUDED.message
       RETURNING *`,
      [reqId, donorId, message]
    );

    res.status(200).json({
      success: true,
      message: 'Thank you! Your donation commitment has been dispatched to the hospital triage desk.',
      data: rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/blood/requests/:id/fulfill
 * Mark request as FULFILLED
 */
export const fulfillBloodRequest = async (req, res, next) => {
  try {
    const reqId = req.params.id;

    const { rows } = await query(
      `UPDATE blood_requests
       SET status = 'FULFILLED'
       WHERE id = $1
       RETURNING *`,
      [reqId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Requisition not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Blood requisition fulfilled and logged to State Telemetry',
      data: rows[0],
    });
  } catch (error) {
    next(error);
  }
};
