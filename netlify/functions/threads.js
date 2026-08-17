// Netlify Function: threads.js
// Path: /.netlify/functions/threads
// Full CRUD for persistent video threads in MongoDB Atlas

import { getDb } from './db.js';

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

    // 1. GET: Fetch threads list or single thread with messages
    if (event.httpMethod === 'GET') {
      const { threadId, sessionId } = event.queryStringParameters || {};

      if (threadId) {
        const thread = await threadsCol.findOne({ threadId });
        if (!thread) {
          return {
            statusCode: 404,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Thread not found' })
          };
        }
        const messages = await messagesCol.find({ threadId }).sort({ timestamp: 1 }).toArray();
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
          body: JSON.stringify({ thread, messages })
        };
      }

      // Fetch all threads for session (or top 50 recent)
      const query = sessionId ? { sessionId } : {};
      const threads = await threadsCol.find(query).sort({ updatedAt: -1 }).limit(50).toArray();

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ threads })
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

      const now = new Date();
      const doc = {
        ...data,
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

      await threadsCol.deleteOne({ threadId });
      await messagesCol.deleteMany({ threadId });

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
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
