// Netlify Function Helper: db.js
// Universal Real-Time Persistent Storage for Netlify Serverless Functions & n8n Callbacks

const MASTER_STORE_ID = 'ff8081819ff5b11001a013d111a43fe3';
const API_URL = `https://api.restful-api.dev/objects/${MASTER_STORE_ID}`;

async function fetchRemoteStore() {
  try {
    const url = `${API_URL}?_t=${Date.now()}_${Math.random()}`;
    const res = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    if (res.ok) {
      const json = await res.json();
      return json.data?.threads || {};
    }
  } catch (e) {
    console.warn('[DB] Remote store fetch error:', e.message);
  }
  return {};
}

async function saveRemoteStore(threads) {
  try {
    const res = await fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'viral_shorts_ai_master_store_v1',
        data: {
          threads,
          updatedAt: new Date().toISOString()
        }
      })
    });
    return res.ok;
  } catch (e) {
    console.warn('[DB] Remote store save error:', e.message);
    return false;
  }
}

const cloudDb = {
  collection: (name) => {
    if (name === 'threads') {
      return {
        findOne: async (q) => {
          const threads = await fetchRemoteStore();
          if (q.threadId) {
            return threads[q.threadId] || null;
          }
          return null;
        },
        find: (q = {}) => ({
          sort: () => ({
            limit: (n) => ({
              toArray: async () => {
                const threads = await fetchRemoteStore();
                let all = Object.values(threads);
                if (q.threadId) {
                  all = all.filter(t => t.threadId === q.threadId || t.id === q.threadId);
                } else if (q.status?.$in) {
                  all = all.filter(t => q.status.$in.includes(t.status));
                }
                all.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
                return all.slice(0, n);
              }
            }),
            toArray: async () => {
              const threads = await fetchRemoteStore();
              let all = Object.values(threads);
              if (q.threadId) {
                all = all.filter(t => t.threadId === q.threadId || t.id === q.threadId);
              } else if (q.status?.$in) {
                all = all.filter(t => q.status.$in.includes(t.status));
              }
              all.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
              return all;
            }
          })
        }),
        updateOne: async (filter, update, options) => {
          const threadId = filter.threadId;
          const threads = await fetchRemoteStore();
          const existing = threads[threadId] || {};

          const setDoc = update.$set || {};
          const pushDoc = update.$push || {};
          const setOnInsertDoc = (options?.upsert && !existing.createdAt) ? (update.$setOnInsert || {}) : {};
          
          let messages = existing.messages || [];
          if (pushDoc.messages) {
            messages = [...messages, pushDoc.messages];
          }

          const newDoc = { 
            ...existing, 
            ...setOnInsertDoc,
            ...setDoc, 
            messages,
            threadId,
            id: threadId,
            updatedAt: setDoc.updatedAt || new Date().toISOString()
          };

          threads[threadId] = newDoc;
          await saveRemoteStore(threads);

          return { acknowledged: true, upsertedId: threadId };
        },
        deleteOne: async (q) => {
          const threadId = q.threadId;
          const threads = await fetchRemoteStore();
          delete threads[threadId];
          await saveRemoteStore(threads);
          return { acknowledged: true };
        }
      };
    }

    if (name === 'messages') {
      return {
        find: (q) => ({
          sort: () => ({
            limit: (n) => ({
              toArray: async () => {
                const threads = await fetchRemoteStore();
                const thread = q.threadId ? threads[q.threadId] : null;
                const msgs = thread?.messages || [];
                return msgs.slice(0, n);
              }
            }),
            toArray: async () => {
              const threads = await fetchRemoteStore();
              const thread = q.threadId ? threads[q.threadId] : null;
              return thread?.messages || [];
            }
          })
        }),
        insertOne: async (doc) => {
          const threadId = doc.threadId;
          if (threadId) {
            const threads = await fetchRemoteStore();
            if (threads[threadId]) {
              threads[threadId].messages = [...(threads[threadId].messages || []), doc];
              await saveRemoteStore(threads);
            }
          }
          return { acknowledged: true, insertedId: doc._id || Date.now() };
        },
        deleteMany: async (q) => {
          const threadId = q.threadId;
          if (threadId) {
            const threads = await fetchRemoteStore();
            if (threads[threadId]) {
              threads[threadId].messages = [];
              await saveRemoteStore(threads);
            }
          }
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
  return cloudDb;
}
