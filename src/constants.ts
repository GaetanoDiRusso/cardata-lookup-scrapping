import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const CAPMONSTER_API_KEY = process.env.CAPMONSTER_API_KEY || '';
export const TWO_CAPTCHA_API_KEY = process.env.TWO_CAPTCHA_API_KEY || '';

// Add some validation to help with debugging
if (!CAPMONSTER_API_KEY) {
  console.warn('Warning: CAPMONSTER_API_KEY is not set in environment variables');
}

if (!TWO_CAPTCHA_API_KEY) {
  console.warn('Warning: TWO_CAPTCHA_API_KEY is not set in environment variables');
}