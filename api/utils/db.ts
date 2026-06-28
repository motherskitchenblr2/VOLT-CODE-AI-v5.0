import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

let cachedConnection = (global as any).mongoose;

if (!cachedConnection) {
  cachedConnection = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cachedConnection.conn) return cachedConnection.conn;

  if (!cachedConnection.promise) {
    if (!MONGODB_URI) {
      throw new Error('[DB FATAL] MONGODB_URI environment variable is missing.');
    }
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      socketTimeoutMS: 30000,
    };
    cachedConnection.promise = mongoose.connect(MONGODB_URI, opts).then((m) => m);
  }
  
  try {
    cachedConnection.conn = await cachedConnection.promise;
  } catch (e) {
    cachedConnection.promise = null;
    throw e;
  }
  return cachedConnection.conn;
}
