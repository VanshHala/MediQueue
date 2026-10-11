/**
 * Predefined Ahmedabad Areas with Geographic Coordinates
 */
export const AHMEDABAD_AREAS = {
  'Navrangpura': { lat: 23.0365, lng: 72.5611, zone: 'West Zone' },
  'Satellite': { lat: 23.0304, lng: 72.5177, zone: 'West Zone' },
  'Vastrapur': { lat: 23.0350, lng: 72.5293, zone: 'West Zone' },
  'Maninagar': { lat: 22.9978, lng: 72.6030, zone: 'South Zone' },
  'Chandkheda': { lat: 23.1118, lng: 72.5804, zone: 'North Zone' },
  'Bopal': { lat: 23.0338, lng: 72.4634, zone: 'West Extension' },
  'SG Highway': { lat: 23.0754, lng: 72.5086, zone: 'North West' },
  'Naroda': { lat: 23.0682, lng: 72.6517, zone: 'East Zone' },
  'Ellisbridge': { lat: 23.0235, lng: 72.5714, zone: 'Central Zone' },
  'Civil Hospital (Asarwa)': { lat: 23.0526, lng: 72.5938, zone: 'Central North' },
};

/**
 * Calculate distance between two coordinate pairs in kilometers using the Haversine formula
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return 999.9; // Fallback distance if coordinates missing
  }

  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

/**
 * Compatible donor blood groups for a given recipient blood group
 */
export const COMPATIBLE_DONORS_FOR_RECIPIENT = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'],
};

/**
 * Recipient groups that a given donor blood group can donate to
 */
export const CAN_DONATE_TO_RECIPIENTS = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

/**
 * Mask a 10-digit phone number for donor privacy (e.g., 9876543210 -> 98765***** or +91 98765 *****)
 */
export const maskPhoneNumber = (phone) => {
  if (!phone) return '98765*****';
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length >= 10) {
    const visible = clean.slice(-10, -5);
    return `${visible}*****`;
  }
  return `${phone.slice(0, 4)}*****`;
};

/**
 * Check if a donor is eligible (>= 90 days since last donation date or never donated)
 */
export const checkDonorEligibility = (lastDonationDate) => {
  if (!lastDonationDate) {
    return {
      isEligible: true,
      daysSinceLastDonation: null,
      message: 'Never donated before (Eligible)',
    };
  }

  const lastDate = new Date(lastDonationDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const isEligible = diffDays >= 90;
  return {
    isEligible,
    daysSinceLastDonation: diffDays,
    daysRemaining: isEligible ? 0 : 90 - diffDays,
    message: isEligible
      ? `Last donated ${diffDays} days ago (Eligible)`
      : `Eligible in ${90 - diffDays} days (${diffDays}/90 days elapsed)`,
  };
};
