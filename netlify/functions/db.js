// db.js — Production-Grade MongoDB Atlas Connection with Pool Caching & In-Memory Fallback
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://suzainkhan8360_db_user:3bvuvLwwzo7kd4OH@viral-shorts-ai-studio.shfhvsw.mongodb.net/viral-shorts-ai-studio?retryWrites=true&w=majority';
const DB_NAME = 'viral-shorts-ai-studio';

let cachedClient = null;
let cachedDb = null;

// In-memory fallback map for resilience in offline/disconnected environments
if (!globalThis.__shortsFallbackStore) {
  globalThis.__shortsFallbackStore = {
    threads: new Map(),
    messages: new Map(),
    users: new Map()
  };
}

const fallbackStore = globalThis.__shortsFallbackStore;

export async function getDb() {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    if (!cachedClient) {
      cachedClient = new MongoClient(MONGODB_URI, {
        connectTimeoutMS: 8000,
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 10
      });
      await cachedClient.connect();
    }
    cachedDb = cachedClient.db(DB_NAME);
    return cachedDb;
  } catch (err) {
    console.warn('[db.js] MongoDB Atlas connection failed, using fallback in-memory store:', err.message);
    
    // Return an in-memory collection shim that mirrors MongoDB API
    return {
      collection: (name) => {
        const store = fallbackStore[name] || new Map();
        fallbackStore[name] = store;

        return {
          findOne: async (query = {}) => {
            for (const doc of store.values()) {
              let match = true;
              for (const [k, v] of Object.entries(query)) {
                if (doc[k] !== v) { match = false; break; }
              }
              if (match) return doc;
            }
            return null;
          },
          find: (query = {}) => ({
            sort: () => ({
              limit: (n) => ({
                toArray: async () => {
                  const results = [];
                  for (const doc of store.values()) {
                    let match = true;
                    for (const [k, v] of Object.entries(query)) {
                      if (doc[k] !== v) { match = false; break; }
                    }
                    if (match) results.push(doc);
                  }
                  return results.slice(0, n);
                }
              }),
              toArray: async () => {
                const results = [];
                for (const doc of store.values()) {
                  let match = true;
                  for (const [k, v] of Object.entries(query)) {
                    if (doc[k] !== v) { match = false; break; }
                  }
                  if (match) results.push(doc);
                }
                return results;
              }
            })
          }),
          insertOne: async (doc) => {
            const id = doc.id || doc._id || doc.threadId || doc.email || String(Date.now());
            const fullDoc = { ...doc, _id: id, id };
            store.set(id, fullDoc);
            return { acknowledged: true, insertedId: id };
          },
          updateOne: async (filter, update, options = {}) => {
            let targetDoc = null;
            let targetKey = null;

            for (const [key, doc] of store.entries()) {
              let match = true;
              for (const [k, v] of Object.entries(filter)) {
                if (doc[k] !== v) { match = false; break; }
              }
              if (match) { targetDoc = doc; targetKey = key; break; }
            }

            if (!targetDoc && options.upsert) {
              const newId = filter.id || filter.threadId || filter.email || String(Date.now());
              const newDoc = {
                _id: newId,
                ...filter,
                ...(update.$setOnInsert || {}),
                ...(update.$set || {})
              };
              store.set(newId, newDoc);
              return { acknowledged: true, upsertedId: newId };
            }

            if (targetDoc) {
              const updatedDoc = {
                ...targetDoc,
                ...(update.$set || {})
              };
              store.set(targetKey, updatedDoc);
              return { acknowledged: true, modifiedCount: 1 };
            }

            return { acknowledged: true, modifiedCount: 0 };
          },
          deleteOne: async (filter) => {
            for (const [key, doc] of store.entries()) {
              let match = true;
              for (const [k, v] of Object.entries(filter)) {
                if (doc[k] !== v) { match = false; break; }
              }
              if (match) { store.delete(key); return { acknowledged: true, deletedCount: 1 }; }
            }
            return { acknowledged: true, deletedCount: 0 };
          },
          deleteMany: async () => {
            store.clear();
            return { acknowledged: true };
          },
          countDocuments: async () => store.size
        };
      }
    };
  }
}
