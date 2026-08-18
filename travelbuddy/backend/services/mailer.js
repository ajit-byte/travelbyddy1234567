import dotenv from 'dotenv';

dotenv.config();

const otpStore = new Map();
const rateLimitStore = new Map();

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function generateOTP() {
  // Demo mode uses a fixed OTP
  if (process.env.OTP_DEMO_MODE === 'true') {
    return process.env.DEMO_OTP || '123456';
  }

  return Math.floor(100000 + Math.random() * 900000).toString();
}

function checkRateLimit(key) {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(key, {
      count: 1,
      windowStart: now,
    });

    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;

  return true;
}

export async function sendEmailOTP(email) {
  if (!checkRateLimit(`email:${email}`)) {
    throw Object.assign(
      new Error('Too many OTP requests. Try again in 1 hour.'),
      { status: 429 }
    );
  }

  const otp = generateOTP();

  otpStore.set(`email:${email}`, {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
  });

  // DEMO MODE
  if (process.env.OTP_DEMO_MODE === 'true') {
    console.log('================================');
    console.log('TRAVELBUDDY DEMO OTP');
    console.log('Email:', email);
    console.log('OTP:', otp);
    console.log('================================');

    return;
  }

  // Real email provider should be added here later.
  throw new Error('Email service is not configured.');
}

export function verifyEmailOTP(email, inputOtp) {
  const record = otpStore.get(`email:${email}`);

  if (!record) {
    return {
      valid: false,
      reason: 'expired',
    };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(`email:${email}`);

    return {
      valid: false,
      reason: 'expired',
    };
  }

  if (record.otp !== inputOtp.trim()) {
    return {
      valid: false,
      reason: 'mismatch',
    };
  }

  otpStore.delete(`email:${email}`);

  return {
    valid: true,
  };
}