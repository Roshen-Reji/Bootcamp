/**
 * Email Domain Validator
 * Checks if an email domain has valid MX records (i.e., is a real email domain).
 */
import dns from 'dns';

const dnsPromises = dns.promises;

/**
 * Validates that the email's domain has valid MX records.
 * @param {string} email - The email to validate
 * @returns {Promise<{valid: boolean, message: string}>}
 */
export async function isRealEmailDomain(email) {
  if (!email || !email.includes('@')) {
    return { valid: false, message: 'Invalid email format.' };
  }

  const domain = email.split('@')[1];

  if (!domain || domain.length < 3) {
    return { valid: false, message: 'Invalid email domain.' };
  }

  try {
    const mxRecords = await dnsPromises.resolveMx(domain);
    if (mxRecords && mxRecords.length > 0) {
      return { valid: true, message: 'Valid domain.' };
    }
    return { valid: false, message: `The domain "${domain}" does not appear to accept emails. Please use a valid email address.` };
  } catch (error) {
    // ENOTFOUND or ENODATA means domain doesn't exist or has no MX records
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA' || error.code === 'ESERVFAIL') {
      return { valid: false, message: `The domain "${domain}" does not appear to be valid. Please use a real email address.` };
    }
    // For other DNS errors (network issues), we'll be permissive and allow through
    console.warn('DNS lookup warning:', error.message);
    return { valid: true, message: 'Could not verify domain, allowing through.' };
  }
}
