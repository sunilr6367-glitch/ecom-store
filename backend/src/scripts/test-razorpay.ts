import Razorpay from 'razorpay';
import 'dotenv/config';

async function test() {
  const rzpKeyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_ID;
  const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;
  
  console.log('Keys:', { rzpKeyId, rzpKeySecret });
  
  const rzp = new Razorpay({ key_id: rzpKeyId, key_secret: rzpKeySecret });
  try {
    const payment = await rzp.payments.fetch('pay_T7yDaw3PK6fKjn');
    console.log('Payment fetched successfully:', payment);
  } catch (err) {
    console.error('Error fetching payment:', err);
  }
}

test();
