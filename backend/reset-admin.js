/**
 * reset-admin.js
 * Run with: node reset-admin.js
 * Lists all users and resets the admin password to Admin@1234
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/athlete_tracker';
  console.log('Connecting to:', uri);
  await mongoose.connect(uri);

  const User = mongoose.model('User', new mongoose.Schema({
    username: String,
    email: String,
    role: String,
    password: String,
    isActive: Boolean,
    createdAt: Date,
  }, { strict: false }));

  // List all users
  const users = await User.find({}, 'username email role isActive createdAt');
  console.log('\n=== Users in database ===');
  if (users.length === 0) {
    console.log('No users found.');
  } else {
    users.forEach((u, i) => {
      console.log(`${i + 1}. username: "${u.username}" | email: "${u.email}" | role: ${u.role} | active: ${u.isActive}`);
    });
  }

  // Reset admin password
  const admin = users.find(u => u.role === 'admin');
  if (admin) {
    const hashed = await bcrypt.hash('Admin@1234', 12);
    await User.updateOne({ _id: admin._id }, { $set: { password: hashed, loginAttempts: 0, lockUntil: null } });
    console.log(`\n✅ Password reset for admin "${admin.username}"`);
    console.log('   New credentials:');
    console.log(`   Username : ${admin.username}`);
    console.log('   Password : Admin@1234');
    console.log('\n⚠️  Change your password after logging in!');
  } else {
    console.log('\nNo admin user found. Run the app and use /register to create one.');
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
