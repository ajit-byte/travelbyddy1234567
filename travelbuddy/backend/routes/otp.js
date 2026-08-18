import express from 'express';
import jwt from 'jsonwebtoken';
import { sendEmailOTP, verifyEmailOTP } from '../services/mailer.js';

const router = express.Router();

router.post('/send-email', async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ msg: 'Valid email is required' });
  }
  try {
    await sendEmailOTP(email);
    res.json({ msg: 'OTP sent' });
  } catch (err) {
    if (err.status === 429) return res.status(429).json({ msg: err.message });
    // Log full error details for debugging
    console.error('sendEmailOTP error code:', err.code);
    console.error('sendEmailOTP error response:', err.response);
    console.error('sendEmailOTP error:', err.message);
    console.error('EMAIL_USER set:', !!process.env.EMAIL_USER, '| SMTP_USER set:', !!process.env.SMTP_USER);
    res.status(500).json({ 
      msg: 'Failed to send OTP. Please try again.',
      // Only show detail in non-production for debugging — remove after fix
      detail: process.env.NODE_ENV !== 'production' ? err.message : undefined,
      emailConfigured: !!(process.env.EMAIL_USER || process.env.SMTP_USER)
    });
  }
});

router.post('/verify-email', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ msg: 'Email and OTP are required' });

  const result = verifyEmailOTP(email, otp);
  if (!result.valid) {
    if (result.reason === 'expired') return res.status(410).json({ msg: 'OTP has expired. Please request a new one.' });
    return res.status(401).json({ msg: 'Incorrect OTP. Please try again.' });
  }

  const resetToken = jwt.sign(
    { identifier: email, purpose: 'password_reset' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  res.json({ msg: 'Email verified', resetToken });
});

export default router;
