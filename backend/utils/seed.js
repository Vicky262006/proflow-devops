const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const logger = require('./logger');

const seedData = async () => {
  try {
    await connectDB();

    logger.info('Starting database seeding...');

    // 1. Seed Admin
    const adminEmail = 'admin@proflow.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        username: 'admin',
        email: adminEmail,
        password: 'admin123',
        role: 'admin',
        department: 'DevOps Platform',
        position: 'System Administrator',
      });
      logger.info('Default admin seeded successfully! (admin@proflow.com / admin123)');
    } else {
      logger.info('Admin user already exists.');
    }

    // 2. Seed Employee
    const employeeEmail = 'employee@proflow.com';
    const existingEmployee = await User.findOne({ email: employeeEmail });
    if (!existingEmployee) {
      await User.create({
        username: 'employee',
        email: employeeEmail,
        password: 'employee123',
        role: 'employee',
        department: 'Engineering',
        position: 'Software Engineer',
      });
      logger.info('Default employee seeded successfully! (employee@proflow.com / employee123)');
    } else {
      logger.info('Employee user already exists.');
    }

    logger.info('Seeding process complete!');
    process.exit(0);
  } catch (error) {
    logger.error('Error during seeding:', error);
    process.exit(1);
  }
};

seedData();
