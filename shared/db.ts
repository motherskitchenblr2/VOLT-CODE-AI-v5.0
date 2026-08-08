import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

type MongooseInstance = Awaited<ReturnType<typeof mongoose.connect>>;

interface CachedConnection {
  conn: MongooseInstance | null;
  promise: Promise<MongooseInstance> | null;
}

const globalForMongoose = globalThis as typeof globalThis & { mongoose?: CachedConnection };

const cachedConnection: CachedConnection = globalForMongoose.mongoose || { conn: null, promise: null };
if (!globalForMongoose.mongoose) {
  globalForMongoose.mongoose = cachedConnection;
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
