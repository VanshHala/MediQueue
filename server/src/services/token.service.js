/**
 * MediQueue Token Generation Service
 * 
 * Generates atomic daily tokens per category:
 * - EMERGENCY -> E01, E02...
 * - SENIOR -> S01, S02...
 * - GENERAL -> G01, G02...
 * 
 * Automatically detects patients >= 60 as SENIOR.
 * Uses atomic upsert on token_counters table inside a transaction.
 */

export const determineCategory = ({ isEmergency = false, age = 0 }) => {
  if (isEmergency) {
    return 'EMERGENCY';
  }
  if (parseInt(age, 10) >= 60) {
    return 'SENIOR';
  }
  return 'GENERAL';
};

export const getCategoryPrefix = (category) => {
  switch (category) {
    case 'EMERGENCY':
      return 'E';
    case 'SENIOR':
      return 'S';
    case 'GENERAL':
    default:
      return 'G';
  }
};

/**
 * Generate an atomic token within an existing client or transaction
 * @param {import('pg').PoolClient|import('pg').Pool} client - Database client
 * @param {string} apptDate - YYYY-MM-DD
 * @param {string} category - EMERGENCY | SENIOR | GENERAL
 * @returns {Promise<string>} e.g. "S04"
 */
export const generateNextToken = async (client, apptDate, category) => {
  const query = `
    INSERT INTO token_counters (appt_date, category, last_number)
    VALUES ($1, $2, 1)
    ON CONFLICT (appt_date, category)
    DO UPDATE SET last_number = token_counters.last_number + 1
    RETURNING last_number
  `;

  const res = await client.query(query, [apptDate, category]);
  const lastNumber = res.rows[0].last_number;
  const prefix = getCategoryPrefix(category);
  const tokenNo = `${prefix}${String(lastNumber).padStart(2, '0')}`;

  return tokenNo;
};
