import 'dotenv/config';
import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set in .env');
  process.exit(1);
}
// Log safe preview (no password)
const preview = uri.replace(/:[^:@/]+@/, ':***@');
console.log('URI (redacted):', preview);

try {
  await mongoose.connect(uri);
  console.log('Result: OK');
  console.log('  Host(s):', mongoose.connection.host);
  console.log('  DB name: ', mongoose.connection.name);
  await mongoose.disconnect();
  process.exit(0);
} catch (e) {
  console.error('Result: FAILED');
  console.error(' ', e.message);
  if (e.reason) console.error(' ', String(e.reason));
  process.exit(1);
}
