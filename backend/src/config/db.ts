import mongoose from 'mongoose';
import logger from '../utils/logger';

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error(
      'MONGO_URI is not set in .env\n' +
      '  → Local:  MONGO_URI=mongodb://localhost:27017/athlete_tracker\n' +
      '  → Atlas:  MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/athlete_tracker'
    );
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // fail fast instead of hanging 30s
    });
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    const isLocalRefused =
      err instanceof Error && err.message.includes('ECONNREFUSED');

    if (isLocalRefused) {
      logger.error(
        'MongoDB connection refused.\n' +
        '  If using local MongoDB:\n' +
        '    → Windows: run  net start MongoDB  (or start MongoDB service)\n' +
        '    → Or install from https://www.mongodb.com/try/download/community\n' +
        '  If using Atlas:\n' +
        '    → Set MONGO_URI=mongodb+srv://... in your .env file'
      );
    }

    throw err;
  }
};

export default connectDB;
