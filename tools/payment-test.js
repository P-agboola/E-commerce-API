// payment-test.js
// Run this script with: node payment-test.js

// Note: This script is for demonstration and testing purposes.
// It's not meant to be used in production code.

const axios = require('axios');
require('dotenv').config();

// Replace with actual values
const API_URL = 'http://localhost:3000/api';
const JWT_TOKEN = 'user_jwt_token';
const ORDER_ID = 'order_id';

async function testStripePayment() {
  try {
    console.log('Testing Stripe Payment Integration...');

    // 1. Create payment
    const paymentResponse = await axios.post(
      `${API_URL}/payments`,
      {
        orderId: ORDER_ID,
        amount: 99.99,
        provider: 'stripe',
      },
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      },
    );

    console.log('Payment created:', paymentResponse.data);

    const paymentId = paymentResponse.data.id;
    const clientSecret = paymentResponse.data.details.clientSecret;

    console.log('Payment Intent Client Secret:', clientSecret);
    console.log('1. Use this client secret with Stripe.js');
    console.log('2. After confirming payment with Stripe.js, call:');
    console.log(`   POST ${API_URL}/payments/${paymentId}/finalize`);
  } catch (error) {
    console.error(
      'Stripe payment test failed:',
      error.response?.data || error.message,
    );
  }
}

async function testPayPalPayment() {
  try {
    console.log('Testing PayPal Payment Integration...');

    // 1. Create payment
    const paymentResponse = await axios.post(
      `${API_URL}/payments`,
      {
        orderId: ORDER_ID,
        amount: 99.99,
        provider: 'paypal',
      },
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      },
    );

    console.log('Payment created:', paymentResponse.data);

    const paymentId = paymentResponse.data.id;
    const approvalUrl = paymentResponse.data.details.approvalUrl;

    console.log('PayPal Approval URL:', approvalUrl);
    console.log('1. Open this URL to approve payment');
    console.log('2. After approval, PayPal will redirect to your return URL');
    console.log('3. Then finalize payment with:');
    console.log(`   POST ${API_URL}/payments/${paymentId}/finalize`);
  } catch (error) {
    console.error(
      'PayPal payment test failed:',
      error.response?.data || error.message,
    );
  }
}

// Run tests
(async () => {
  console.log('=== PAYMENT INTEGRATION TESTING ===');
  await testStripePayment();
  console.log('\n');
  await testPayPalPayment();
})();
