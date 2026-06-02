// ============================================================
// Service: Vendor Standardization & Normalization Service
// Standardizes vendor names to prevent Knowledge Graph fragmentation
// ============================================================
import { logger } from '../../infrastructure/logging/logger.js';

// Pre-defined mapping of common variations to canonical names
const CANONICAL_VENDORS = {
  microsoft: [
    'microsoft', 'microsoft corp', 'microsoft corporation', 'msft', 
    'microsoft india', 'microsoft technologies'
  ],
  google: [
    'google', 'google llc', 'google inc', 'alphabet', 'alphabet inc', 
    'google india'
  ],
  amazon: [
    'amazon', 'amazon.com', 'amazon web services', 'aws', 'amazon technologies',
    'amazon seller services'
  ],
  oracle: [
    'oracle', 'oracle corp', 'oracle corporation', 'oracle financial services'
  ],
  salesforce: [
    'salesforce', 'salesforce.com', 'salesforce corp', 'salesforce inc'
  ],
  tata_consultancy: [
    'tata consultancy', 'tata consultancy services', 'tcs', 'tata consultancy services ltd'
  ],
  infosys: [
    'infosys', 'infosys limited', 'infosys ltd', 'infosys technologies'
  ],
  reliance: [
    'reliance', 'reliance industries', 'ril', 'reliance industries limited',
    'reliance retail', 'jio'
  ],
  hdfc: [
    'hdfc', 'hdfc bank', 'hdfc bank limited', 'hdfc ltd'
  ],
  icici: [
    'icici', 'icici bank', 'icici bank limited', 'icici prudential'
  ]
};

/**
 * Standardizes vendor name into a clean, canonical form.
 * @param {string} rawName - The raw vendor name extracted from the document.
 * @returns {string} The standardized/canonical vendor name.
 */
export const normalizeVendorName = (rawName) => {
  if (!rawName || typeof rawName !== 'string') return 'General Vendor';

  const clean = rawName.trim().toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // remove punctuation
    .replace(/\s+/g, ' '); // collapse whitespace

  // Search canonical dictionary
  for (const [canonical, variations] of Object.entries(CANONICAL_VENDORS)) {
    if (variations.some(v => clean === v || clean.includes(v))) {
      // Return formatted uppercase/standard representation
      return canonical
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  }

  // Fallback to title-cased cleaned name
  return rawName
    .trim()
    .replace(/\b(corp|corporation|inc|ltd|limited|llc|co|company)\b/gi, '') // strip common legal suffixes
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ') || 'General Vendor';
};

export default { normalizeVendorName };
