/**
 * One-time dev seed: creates a demo user if not present.
 * Run: npm run seed  (from backend folder, with .env loaded)
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

const DEMO = {
  name: 'Demo User',
  email: 'demo@invoicepro.local',
  password: 'DemoPass123!',
};

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is missing. Set it in backend/.env');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const existing = await User.findOne({ email: DEMO.email });
  if (existing) {
    console.log('Demo user already exists. Login with:');
    console.log('  Email:   ', DEMO.email);
    console.log('  Password:', DEMO.password);
    await mongoose.disconnect();
    return;
  }
  await User.create(DEMO);
  console.log('Demo user created. Login on the app with:');
  console.log('  Email:   ', DEMO.email);
  console.log('  Password:', DEMO.password);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
