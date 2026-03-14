const mongoose = require('mongoose');

async function connectDatabase() {
  const databaseUri = process.env.MONGODB_URI;

  if (!databaseUri) {
    throw new Error('Thieu MONGODB_URI trong file .env');
  }

  try {
    await mongoose.connect(databaseUri);
    console.log('Ket noi MongoDB thanh cong');
  } catch (error) {
    console.error('Ket noi MongoDB that bai');
    throw error;
  }
}

module.exports = connectDatabase;