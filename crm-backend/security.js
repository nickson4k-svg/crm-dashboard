const crypto = require('crypto');

function getClientIp(req) {
  // Vercel/NGINX may set these; fall back to remoteAddress.
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    // XFF may include multiple IPs: client, proxy1, proxy2
    return xff.split(',')[0].trim();
  }
  return req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
}

function stableHash(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

module.exports = {
  getClientIp,
  stableHash,
};

