const Razorpay = require('razorpay');
require('dotenv').config();

async function test() {
  const rzpKeyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_ID;
  const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;
  
  console.log('Keys:', { rzpKeyId, rzpKeySecret });
  
  const auth = Buffer.from(`${rzpKeyId}:${rzpKeySecret}`).toString('base64');
  try {
    const res = await fetch(`https://api.razorpay.com/v1/payments/pay_T7yDaw3PK6fKjn`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    console.log('Direct Fetch status:', res.status);
    const json = await res.json();
    console.log('Direct Fetch body:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Direct Fetch error:', err);
  }
}

test();
