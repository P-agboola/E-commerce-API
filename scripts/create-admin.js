/**
 * Script to create an admin user
 * Usage: node create-admin.js <email> <password>
 */
require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function createAdmin() {
  // Get email and password from command line arguments
  const email = process.argv[2];
  const password = process.argv[3];
  const firstName = process.argv[4] || 'Admin';
  const lastName = process.argv[5] || 'User';

  if (!email || !password) {
    console.error(
      'Usage: node create-admin.js <email> <password> [firstName] [lastName]',
    );
    process.exit(1);
  }

  // Connect to database
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate UUID for the user
    const userId = uuidv4();

    // Get current timestamp
    const now = new Date().toISOString();

    // Check if user already exists
    const checkUserQuery = 'SELECT * FROM users WHERE email = $1';
    const checkResult = await client.query(checkUserQuery, [email]);

    if (checkResult.rows.length > 0) {
      console.log(
        `User with email ${email} already exists. Updating to admin role...`,
      );

      // Update user to admin role
      const updateQuery = `
        UPDATE users 
        SET role = 'admin', 
            "firstName" = $1, 
            "lastName" = $2,
            "updatedAt" = $3
        WHERE email = $4
        RETURNING id, email, role`;

      const updateResult = await client.query(updateQuery, [
        firstName,
        lastName,
        now,
        email,
      ]);
      console.log('User updated to admin:', updateResult.rows[0]);
    } else {
      // Insert new admin user
      const insertQuery = `
        INSERT INTO users (
          id, 
          "firstName", 
          "lastName", 
          email, 
          password, 
          role, 
          "isEmailVerified",
          "createdAt", 
          "updatedAt"
        ) 
        VALUES ($1, $2, $3, $4, $5, 'admin', true, $6, $6) 
        RETURNING id, email, role`;

      const result = await client.query(insertQuery, [
        userId,
        firstName,
        lastName,
        email,
        hashedPassword,
        now,
      ]);

      console.log('Admin user created:', result.rows[0]);
    }
  } catch (err) {
    console.error('Error creating admin user:', err);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

createAdmin().catch(console.error);
