// Netlify Function Helper: db.js
// Singleton MongoDB connection pool for Netlify serverless functions

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://suzainkhan8360_db_user:3bvuvLwwzo7kd4OH@viral-shorts-ai-studio.shfhvsw.mongodb.net/?retryWrites=true&w=majority&appName=viral-shorts-ai-studio";
const DB_NAME = process.env.MONGODB_DB_NAME || "shortsai";

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  });

  await client.connect();
  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export async function getDb() {
  const { db } = await connectToDatabase();
  return db;
}
