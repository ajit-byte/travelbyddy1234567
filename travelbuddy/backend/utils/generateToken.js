import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT token for a user.
 * @param {object} payload - e.g. { id, isAdmin }
 * @param {string} expiresIn - e.g. '7d'
 * @returns {Promise<string>} signed token
 */
export function generateToken(payload, expiresIn = '7d') {
  return new Promise((resolve, reject) => {
    jwt.sign({ user: payload }, process.env.JWT_SECRET, { expiresIn }, (err, token) => {
      if (err) reject(err);
      else resolve(token);
    });
  });
}
