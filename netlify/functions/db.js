// Netlify Function Helper: db.js
// Safe MongoDB connection pool with fallback

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://suzainkhan8360_db_user:3bvuvLwwzo7kd4OH@viral-shorts-ai-studio.shfhvsw.mongodb.net/shortsai?retryWrites=true&w=majority&appName=viral-shorts-ai-studio';
const DB_NAME = process.env.MONGODB_DB_NAME || "shortsai";

let cachedClient = null;
let cachedDb = null;

// In-memory fallback if MongoDB is not yet configured or temporarily offline
const inMemoryStore = {
  threads: new Map(),
  messages: []
};

const fallbackDb = {
  collection: (name) => {
    if (name === 'threads') {
      return {
        findOne: async (q) => {
          if (q.threadId) return inMemoryStore.threads.get(q.threadId) || null;
          return null;
        },
        find: (q) => ({
          sort: () => ({
            limit: (n) => ({
              toArray: async () => Array.from(inMemoryStore.threads.values()).slice(0, n)
            }),
            toArray: async () => Array.from(inMemoryStore.threads.values())
          })
        }),
        updateOne: async (filter, update, options) => {
          const threadId = filter.threadId;
          const existing = inMemoryStore.threads.get(threadId) || {};
          const setDoc = update.$set || {};
          const pushDoc = update.$push || {};
          
          let messages = existing.messages || [];
          if (pushDoc.messages) {
            messages = [...messages, pushDoc.messages];
          }

          const newDoc = { 
            ...existing, 
            ...setDoc, 
            messages,
            threadId 
          };
          inMemoryStore.threads.set(threadId, newDoc);
          return { acknowledged: true, upsertedId: threadId };
        },
        deleteOne: async (q) => {
          inMemoryStore.threads.delete(q.threadId);
          return { acknowledged: true };
        }
      };
    }

    if (name === 'messages') {
      return {
        find: (q) => ({
          sort: () => ({
            limit: (n) => ({
              toArray: async () => inMemoryStore.messages.filter(m => !q.threadId || m.threadId === q.threadId || (q.threadId?.$in && q.threadId.$in.includes(m.threadId))).slice(0, n)
            }),
            toArray: async () => inMemoryStore.messages.filter(m => !q.threadId || m.threadId === q.threadId || (q.threadId?.$in && q.threadId.$in.includes(m.threadId)))
          })
        }),
        insertOne: async (doc) => {
          inMemoryStore.messages.push(doc);
          return { acknowledged: true, insertedId: doc._id || Date.now() };
        },
        deleteMany: async (q) => {
          inMemoryStore.messages = inMemoryStore.messages.filter(m => m.threadId !== q.threadId);
          return { acknowledged: true };
        }
      };
    }

    return {
      find: () => ({ toArray: async () => [] }),
      findOne: async () => null,
      insertOne: async () => ({ acknowledged: true }),
      updateOne: async () => ({ acknowledged: true }),
      deleteOne: async () => ({ acknowledged: true }),
      deleteMany: async () => ({ acknowledged: true })
    };
  }
};

export async function getDb() {
  if (cachedClient && cachedDb) {
    return cachedDb;
  }

  try {
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000
    });

    await client.connect();
    const db = client.db(DB_NAME);

    cachedClient = client;
    cachedDb = db;

    return db;
  } catch (err) {
    console.warn('MongoDB connection fallback:', err.message);
    return fallbackDb;
  }
}
