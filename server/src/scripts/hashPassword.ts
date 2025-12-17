// Create a quick script: hashPassword.ts
import bcrypt from 'bcryptjs';

const password = 'Admin123!'; // Replace with the password you want to hash
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

console.log('Hashed password:', hashedPassword);
