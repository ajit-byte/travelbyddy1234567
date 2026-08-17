// Phone OTP via SMS is currently disabled.
// To re-enable, integrate an SMS provider (e.g. Sparrow SMS, MSG91, or upgrade Twilio).

export async function sendPhoneOTP(phone) {
  throw Object.assign(new Error('Phone OTP is not available at this time.'), { status: 503 });
}

export async function verifyPhoneOTP(phone, inputOtp) {
  return { valid: false, reason: 'unavailable' };
}
