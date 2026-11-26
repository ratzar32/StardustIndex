// server.js
// This is the whole backend. It does two things:
//   1) Saves a star rating + comment for a chapter (one per visitor).
//   2) Returns the average score + count for a chapter.

require('dotenv').config();               // loads variables from .env into process.env
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());                          // lets your frontend (a different origin) call this API
app.use(express.json());                  // lets Express read JSON request bodies

// ---- connect to MongoDB once when the server starts ----
const client = new MongoClient(process.env.MONGO_URI);
let reviewsCollection;

async function start() {
  await client.connect();
  const db = client.db('elit');           // database name
  reviewsCollection = db.collection('reviews'); // collection name

  // Enforce "one review per visitor per chapter" at the database level too.
  await reviewsCollection.createIndex(
    { chapterId: 1, anonId: 1 },
    { unique: true }
  );

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`elit-api listening on port ${PORT}`));
}

// ---- POST /api/review ----
// Body: { chapterId: "chapter-1", anonId: "uuid-from-browser", score: 8, comment: "..." }
app.post('/api/review', async (req, res) => {
  try {
    const { chapterId, anonId, score, comment } = req.body;

    if (!chapterId || !anonId || typeof score !== 'number') {
      return res.status(400).json({ error: 'chapterId, anonId and numeric score are required' });
    }
    if (score < 1 || score > 10) {
      return res.status(400).json({ error: 'score must be between 1 and 10' });
    }

    await reviewsCollection.updateOne(
      { chapterId, anonId },              // find this visitor's review for this chapter
      {
        $set: {
          score,
          comment: (comment || '').slice(0, 1000), // basic length guard
          updatedAt: new Date()
        }
      },
      { upsert: true }                    // create it if it doesn't exist yet
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'something went wrong saving the review' });
  }
});

// ---- GET /api/review/:chapterId ----
// Returns: { average: 8.3, count: 42 }
app.get('/api/review/:chapterId', async (req, res) => {
  try {
    const docs = await reviewsCollection
      .find({ chapterId: req.params.chapterId })
      .toArray();

    const count = docs.length;
    const average = count
      ? docs.reduce((sum, d) => sum + d.score, 0) / count
      : 0;

    res.json({ average, count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'something went wrong reading reviews' });
  }
});

start();
