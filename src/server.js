require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const useDatabaseUrl = Boolean(process.env.DATABASE_URL);
const pool = new Pool(
  useDatabaseUrl
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: process.env.PGHOST || 'localhost',
        port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
      }
);

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS books (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      image BYTEA,
      image_mime TEXT,
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ratings (
      id SERIAL PRIMARY KEY,
      book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
      client_id TEXT,
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
    );
  `);
  // На существующих БД добавим столбец, если его нет
  await pool.query(`ALTER TABLE ratings ADD COLUMN IF NOT EXISTS client_id TEXT;`);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS ratings_unique_per_client
    ON ratings (book_id, client_id)
    WHERE client_id IS NOT NULL;
  `);
}

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.get('/api/books', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT b.id, b.title,
             COALESCE(ROUND(AVG(r.score)::numeric, 2), NULL) AS avg_rating,
             COUNT(r.id) AS votes
      FROM books b
      LEFT JOIN ratings r ON r.book_id = b.id
      GROUP BY b.id
      ORDER BY b.id DESC;
    `);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

app.get('/api/books/:id/image', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT image, image_mime FROM books WHERE id=$1', [req.params.id]);
    if (!rows[0] || !rows[0].image) return res.status(404).end();
    res.set('Content-Type', rows[0].image_mime || 'application/octet-stream');
    res.send(rows[0].image);
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
});

app.post('/api/books', upload.single('image'), async (req, res) => {
  try {
    const title = req.body.title?.trim();
    if (!title) return res.status(400).json({ error: 'Title is required' });

    let imageBuffer = null;
    let imageMime = null;
    if (req.file) {
      imageBuffer = req.file.buffer;
      imageMime = req.file.mimetype;
    }

    const { rows } = await pool.query(
      'INSERT INTO books (title, image, image_mime) VALUES ($1, $2, $3) RETURNING id, title',
      [title, imageBuffer, imageMime]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create book' });
  }
});

app.post('/api/books/:id/rate', async (req, res) => {
  try {
    const bookId = Number(req.params.id);
    const score = Number(req.body.score);
    const clientId = (req.headers['x-client-id'] || '').toString().trim() || null;
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return res.status(400).json({ error: 'Score must be 1-5' });
    }
    const exists = await pool.query('SELECT 1 FROM books WHERE id=$1', [bookId]);
    if (exists.rowCount === 0) return res.status(404).json({ error: 'Book not found' });
    try {
      await pool.query('INSERT INTO ratings (book_id, score, client_id) VALUES ($1, $2, $3)', [bookId, score, clientId]);
    } catch (e) {
      if (e && e.code === '23505') {
        return res.status(409).json({ error: 'Already voted' });
      }
      throw e;
    }
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to rate book' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT b.id, b.title,
             COALESCE(ROUND(AVG(r.score)::numeric, 2), NULL) AS avg_rating,
             COUNT(r.id) AS votes
      FROM books b
      LEFT JOIN ratings r ON r.book_id = b.id
      GROUP BY b.id
      ORDER BY votes DESC, avg_rating DESC NULLS LAST, b.id DESC;
    `);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.use(express.static(path.resolve(__dirname, '..', 'public')));

const PORT = process.env.PORT || 3000;
ensureSchema()
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
  })
  .catch((e) => {
    console.error('Failed to init schema', e);
    process.exit(1);
  });
