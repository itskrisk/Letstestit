const axios = require('axios');

// M-Pesa Daraja API Configuration
const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  passkey: process.env.MPESA_PASSKEY,
  shortcode: process.env.MPESA_SHORTCODE || '174379',
  environment: process.env.MPESA_ENVIRONMENT || 'sandbox', // 'sandbox' or 'production'
  callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://your-domain.com/api/payments/callback'
};

// Base URLs
const BASE_URLS = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke'
};

const BASE_URL = BASE_URLS[MPESA_CONFIG.environment] || BASE_URLS.sandbox;

/**
 * Get M-Pesa OAuth token
 */
async function getAuthToken() {
  try {
    const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');
    
    const response = await axios.get(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    return response.data.access_token;
  } catch (error) {
    console.error('M-Pesa auth error:', error.response?.data || error.message);
    throw new Error('Failed to get M-Pesa auth token');
  }
}

/**
 * Initiate STK Push (Lipa Na M-Pesa Online)
 * @param {string} phoneNumber - Customer phone number (format: 2547XXXXXXXX)
 * @param {number} amount - Amount to pay
 * @param {string} accountReference - Order ID or reference
 * @param {string} transactionDesc - Description
 */
async function initiateSTKPush(phoneNumber, amount, accountReference, transactionDesc = 'Payment') {
  try {
    const token = await getAuthToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${MPESA_CONFIG.shortcode}${MPESA_CONFIG.passkey}${timestamp}`).toString('base64');

    const payload = {
      "BusinessShortCode": MPESA_CONFIG.shortcode,
      "Password": password,
      "Timestamp": timestamp,
      "TransactionType": "CustomerPayBillOnline",
      "Amount": Math.round(amount),
      "PartyA": phoneNumber,
      "PartyB": MPESA_CONFIG.shortcode,
      "PhoneNumber": phoneNumber,
      "CallBackURL": MPESA_CONFIG.callbackUrl,
      "AccountReference": accountReference,
      "TransactionDesc": transactionDesc
    };

    const response = await axios.post(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      data: {
        checkoutRequestId: response.data.CheckoutRequestID,
        merchantRequestID: response.data.MerchantRequestID,
        responseCode: response.data.ResponseCode,
        responseDescription: response.data.ResponseDescription,
        customerMessage: response.data.CustomerMessage
      }
    };
  } catch (error) {
    console.error('M-Pesa STK Push error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.errorMessage || error.message || 'Failed to initiate payment'
    };
  }
}

/**
 * Query STK Push status
 */
async function querySTKStatus(checkoutRequestId) {
  try {
    const token = await getAuthToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${MPESA_CONFIG.shortcode}${MPESA_CONFIG.passkey}${timestamp}`).toString('base64');

    const payload = {
      "BusinessShortCode": MPESA_CONFIG.shortcode,
      "Password": password,
      "Timestamp": timestamp,
      "CheckoutRequestID": checkoutRequestId
    };

    const response = await axios.post(`${BASE_URL}/mpesa/stkpush/v1/query`, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('M-Pesa query error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.errorMessage || error.message
    };
  }
}

/**
 * Format phone number to M-Pesa format (2547XXXXXXXX)
 */
function formatPhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 254
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  }
  
  // If doesn't start with 254, add it
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  return cleaned;
}

module.exports = {
  initiateSTKPush,
  querySTKStatus,
  formatPhoneNumber,
  getAuthToken
};
