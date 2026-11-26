// server.js
// This is the whole backend. It does two things:
//   1) Saves a star rating + comment for a chapter (one per visitor).
//   2) Returns the average score + count for a chapter.

require('dotenv').config();               // loads variables from .env into process.env
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
// Only your own site(s) may call this API from a browser. Set ALLOWED_ORIGINS in .env
// (comma-separated, e.g. https://your-site.vercel.app). If unset, any origin is allowed.
const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors(allowed.length ? { origin: allowed } : undefined));
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

// ---- GET /api/admin/reviews  (YOU read all reviews here) ----
// Send your secret in the "x-admin-key" header (must equal ADMIN_KEY in .env).
// Optional: ?chapterId=chapter-1   and   ?format=csv
const crypto = require('crypto');
function keyOk(given) {
  const real = process.env.ADMIN_KEY || '';
  if (!real || !given) return false;
  const a = Buffer.from(String(given)), b = Buffer.from(real);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

app.get('/api/admin/reviews', async (req, res) => {
  if (!keyOk(req.get('x-admin-key'))) return res.status(401).json({ error: 'unauthorized' });
  try {
    const filter = req.query.chapterId ? { chapterId: String(req.query.chapterId) } : {};
    const docs = await reviewsCollection.find(filter, { projection: { anonId: 0 } })
      .sort({ updatedAt: -1 }).toArray();

    if (req.query.format === 'csv') {
      const esc = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
      const rows = [['chapterId', 'score', 'comment', 'updatedAt'].join(',')]
        .concat(docs.map(d => [d.chapterId, d.score, d.comment, d.updatedAt?.toISOString()].map(esc).join(',')));
      res.type('text/csv').send(rows.join('\n'));
    } else {
      res.json({ count: docs.length, reviews: docs });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'something went wrong reading reviews' });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

start();