import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://suzainkhan8360_db_user:3bvuvLwwzo7kd4OH@viral-shorts-ai-studio.shfhvsw.mongodb.net/viral-shorts-ai-studio?retryWrites=true&w=majority';
const DB_NAME = 'viral-shorts-ai-studio';

async function checkUserChannels() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const usersCol = db.collection('users');

    const users = await usersCol.find({}).toArray();
    console.log('All Users:');
    users.forEach((u, i) => {
      console.log(`\nUser ${i + 1}: ${u.email} (ID: ${u.id || u._id})`);
      console.log(' - youtubeChannels:', JSON.stringify(u.youtubeChannels, null, 2));
      console.log(' - googleSheets:', JSON.stringify(u.googleSheets, null, 2));
      console.log(' - updatedAt:', u.updatedAt);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

checkUserChannels();
