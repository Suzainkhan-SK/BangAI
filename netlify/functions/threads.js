// Netlify Function: threads.js
// Path: /.netlify/functions/threads
// Full CRUD for persistent video threads & messages in MongoDB Atlas
// Strictly partitioned by authenticated user identity to prevent cross-account history leaks

import { getDb } from './db.js';
import { verifyToken } from './google-oauth.js';

export const handler = async (event, context) => {
  // CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const db = await getDb();
    const threadsCol = db.collection('threads');
    const messagesCol = db.collection('messages');

    // Extract & verify JWT token if present
    const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim() || (event.queryStringParameters?.token || '');
    const user = verifyToken(token);

    // 1. GET: Fetch threads list or single thread with messages
    if (event.httpMethod === 'GET') {
      const { threadId, sessionId, userId: paramUserId, email: paramEmail } = event.queryStringParameters || {};

      // A. Querying single thread by threadId
      if (threadId) {
        const thread = await threadsCol.findOne({ threadId });
        if (!thread) {
          return {
            statusCode: 404,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Thread not found' })
          };
        }

        // Ownership verification: if thread is assigned to a user, ensure requester owns it
        if (thread.userId || thread.userEmail) {
          const authUid = user ? (user.userId || user.id) : null;
          const authEmail = user?.email ? user.email.toLowerCase() : null;
          const isOwner = (authUid && thread.userId === authUid) ||
                          (authEmail && (
                            (thread.userEmail && thread.userEmail.toLowerCase() === authEmail) ||
                            (thread.email && thread.email.toLowerCase() === authEmail)
                          ));

          if (!isOwner) {
            return {
              statusCode: 403,
              headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: 'Access denied: thread belongs to another user' })
            };
          }
        }

        const messages = await messagesCol.find({ threadId }).sort({ timestamp: 1 }).toArray();
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
          body: JSON.stringify({ 
            thread: {
              ...thread,
              id: thread.threadId,
              messages: (messages && messages.length > 0) ? messages : (thread.messages || [])
            }, 
            messages 
          })
        };
      }

      // B. Querying thread list for current user / session
      // Strictly derive user identity from verified JWT token to prevent data leakage across accounts
      const authUid = user ? (user.userId || user.id) : null;
      const authEmail = user?.email ? user.email.toLowerCase() : null;

      let query = null;
      if (authUid || authEmail) {
        // Authenticated user: strictly find threads created by this specific user
        const userOr = [];
        if (authUid) userOr.push({ userId: authUid });
        if (authEmail) {
          userOr.push({ userEmail: authEmail });
          userOr.push({ email: authEmail });
        }
        query = { $or: userOr };
      } else if (sessionId) {
        // Guest/unauthenticated fallback: ONLY match exact sessionId with NO assigned user
        query = {
          sessionId: sessionId,
          $and: [
            { userId: { $in: [null, undefined, ''] } },
            { userEmail: { $in: [null, undefined, ''] } }
          ]
        };
      } else {
        return {
          statusCode: 401,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Authentication required to view your threads', threads: [] })
        };
      }

      const threads = await threadsCol.find(query).sort({ updatedAt: -1 }).limit(50).toArray();

      // Fetch all messages for these threads to guarantee 100% complete chat history
      const threadIds = threads.map(t => t.threadId).filter(Boolean);
      let messagesByThread = {};
      if (threadIds.length > 0) {
        const allMessages = await messagesCol.find({ threadId: { $in: threadIds } }).sort({ timestamp: 1 }).toArray();
        allMessages.forEach(m => {
          if (!messagesByThread[m.threadId]) messagesByThread[m.threadId] = [];
          messagesByThread[m.threadId].push(m);
        });
      }

      const enrichedThreads = threads.map(t => {
        const dbMsgs = messagesByThread[t.threadId] || [];
        const threadMsgs = t.messages || [];
        const combinedMsgs = dbMsgs.length >= threadMsgs.length ? dbMsgs : threadMsgs;

        return {
          ...t,
          id: t.threadId,
          messages: combinedMsgs
        };
      });

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ threads: enrichedThreads })
      };
    }

    // 2. POST: Create or Update a thread
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body || '{}');
      if (!data.threadId) {
        return {
          statusCode: 400,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'threadId is required' })
        };
      }

      const authUid = user ? (user.userId || user.id) : '';
      const authEmail = user?.email ? user.email.toLowerCase() : '';

      // Prevent unauthorized tampering of another user's existing thread
      const existing = await threadsCol.findOne({ threadId: data.threadId });
      if (existing && (existing.userId || existing.userEmail)) {
        const isOwner = (authUid && existing.userId === authUid) ||
                        (authEmail && (
                          (existing.userEmail && existing.userEmail.toLowerCase() === authEmail) ||
                          (existing.email && existing.email.toLowerCase() === authEmail)
                        ));
        if (!isOwner) {
          return {
            statusCode: 403,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Forbidden: Cannot overwrite another user\'s thread' })
          };
        }
      }

      const now = new Date();
      const doc = {
        ...data,
        userId: authUid || existing?.userId || '',
        userEmail: authEmail || existing?.userEmail || '',
        updatedAt: now
      };

      await threadsCol.updateOne(
        { threadId: data.threadId },
        { 
          $set: doc,
          $setOnInsert: { createdAt: now }
        },
        { upsert: true }
      );

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, threadId: data.threadId })
      };
    }

    // 3. DELETE: Remove a thread and its messages
    if (event.httpMethod === 'DELETE') {
      const { threadId } = event.queryStringParameters || {};
      if (!threadId) {
        return {
          statusCode: 400,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'threadId is required' })
        };
      }

      const authUid = user ? (user.userId || user.id) : '';
      const authEmail = (user?.email || '').toLowerCase();

      const existing = await threadsCol.findOne({ threadId });
      if (existing) {
        if (existing.userId || existing.userEmail) {
          const isOwner = (authUid && existing.userId === authUid) ||
                          (authEmail && (
                            (existing.userEmail && existing.userEmail.toLowerCase() === authEmail) ||
                            (existing.email && existing.email.toLowerCase() === authEmail)
                          ));
          if (!isOwner) {
            return {
              statusCode: 403,
              headers: { 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({ error: 'Forbidden: You do not own this thread' })
            };
          }
        }

        await threadsCol.deleteOne({ threadId });
        await messagesCol.deleteMany({ threadId });
      }

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, deleted: threadId })
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  } catch (err) {
    console.error('Threads API Error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
