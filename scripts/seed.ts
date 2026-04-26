/**
 * Seed script to populate database with initial users
 * Run with: npm run seed
 */

// Load environment variables FIRST before any other imports
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

const envPath = resolve(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  const result = config({ path: envPath });
  if (result.error) {
    console.error('Error loading .env.local:', result.error);
  } else {
    console.log('✓ Loaded environment variables from .env.local');
  }
} else {
  console.warn('Warning: .env.local not found');
}

// Verify MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in environment variables');
  console.error('Please ensure .env.local exists in the project root with MONGODB_URI');
  process.exit(1);
}

// Use dynamic imports to ensure env vars are loaded first
async function seed() {
  // Dynamic imports happen after env vars are loaded
  const { connectDB } = await import('../src/lib/mongodb');
  const User = (await import('../src/lib/models/User')).default;
  const { hashPassword } = await import('../src/lib/auth');

  const users = [
    {
      email: 'admin@shad.com',
      password: 'Qwerty1',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN' as const,
      isActive: true,
    },
    {
      email: 'staff@shad.com',
      password: 'Qwerty1',
      firstName: 'Staff',
      lastName: 'User',
      role: 'STAFF' as const,
      isActive: true,
    },
    {
      email: 'customer@shad.com',
      password: 'Qwerty1',
      firstName: 'Customer',
      lastName: 'User',
      role: 'CUSTOMER' as const,
      isActive: true,
    },
    {
      email: 'dealer@shad.com',
      password: 'Qwerty1',
      firstName: 'Dealer',
      lastName: 'User',
      role: 'DEALER' as const,
      isActive: true,
    },
  ];

  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Connected to database');

    // Clear existing users (optional - comment out if you want to keep existing users)
    // await User.deleteMany({});
    // console.log('Cleared existing users');

    for (const userData of users) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user
      const user = new User({
        ...userData,
        password: hashedPassword,
      });

      await user.save();
      console.log(`✓ Created user: ${userData.email} (${userData.role})`);
    }

    console.log('\n✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
