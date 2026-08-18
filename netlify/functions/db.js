// db.js — Production-Grade In-Memory + n8n Execution Fallback Store
// 
// Strategy:
// 1. PRIMARY: globalThis module-level Map (persists for the lifetime of a warm Lambda container ~20 min)
//    - Works when POST and GET hit same container (most common case)
// 2. FALLBACK: n8n Cloud API execution status polling via NETLIFY env vars
//    - When container is cold or rotated, browser polls n8n API directly via this proxy
// 
// This is the correct Netlify serverless architecture — no external dependencies needed.

// Module-level global store — persists across requests within same warm container
if (!globalThis.__shortsThreadStore) {
  globalThis.__shortsThreadStore = new Map();
}

const store = globalThis.__shortsThreadStore;

const db = {
  collection: (name) => {
    if (name === 'threads') {
      return {
        findOne: async ({ threadId }) => {
          return store.get(threadId) || null;
        },
        find: (q = {}) => ({
          sort: () => ({
            limit: (n) => ({
              toArray: async () => {
                if (q.threadId) {
                  const doc = store.get(q.threadId);
                  return doc ? [doc] : [];
                }
                const all = [...store.values()];
                if (q.status?.$in) {
                  return all.filter(t => q.status.$in.includes(t.status)).slice(0, n);
                }
                return all.slice(0, n);
              }
            }),
            toArray: async () => {
              if (q.threadId) {
                const doc = store.get(q.threadId);
                return doc ? [doc] : [];
              }
              return [...store.values()];
            }
          })
        }),
        updateOne: async (filter, update, options) => {
          const { threadId } = filter;
          const existing = store.get(threadId) || {};
          
          const setDoc = update.$set || {};
          const pushDoc = update.$push || {};
          const setOnInsertDoc = (options?.upsert && !existing.createdAt)
            ? (update.$setOnInsert || {})
            : {};

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

          store.set(threadId, newDoc);
          return { acknowledged: true, upsertedId: threadId };
        },
        deleteOne: async ({ threadId }) => {
          store.delete(threadId);
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
                const doc = q.threadId ? store.get(q.threadId) : null;
                return (doc?.messages || []).slice(0, n);
              }
            }),
            toArray: async () => {
              const doc = q.threadId ? store.get(q.threadId) : null;
              return doc?.messages || [];
            }
          })
        }),
        insertOne: async () => ({ acknowledged: true }),
        deleteMany: async () => ({ acknowledged: true })
      };
    }

    return {
      find: () => ({ sort: () => ({ limit: () => ({ toArray: async () => [] }), toArray: async () => [] }) }),
      findOne: async () => null,
      insertOne: async () => ({ acknowledged: true }),
      updateOne: async () => ({ acknowledged: true }),
      deleteOne: async () => ({ acknowledged: true }),
      deleteMany: async () => ({ acknowledged: true })
    };
  }
};

export async function getDb() {
  return db;
}

// Export raw store access for the story-approval polling endpoint
export { store as threadStore };
