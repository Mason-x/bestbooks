# BestBooks

Goodreads-style book list browser for a local PostgreSQL dataset (`booksdb.public.books`).

## Features (MVP)

- List page only (no detail page, no reviews UI)
- Search by title/author
- Filters: language, genre, rating thresholds, year range
- Sorting: popular, top rated, newest
- Cursor (keyset) pagination for large tables
- JSON API endpoint: `/api/books`

## Setup

1. Create `.env.local`

```bash
cp .env.example .env.local
```

2. Set `DATABASE_URL` in `.env.local`

```env
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/booksdb
```

3. Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:3000/books`.

## Performance (Important)

Your `books` table has 10M+ rows. Create indexes before expecting good search/filter performance:

```bash
psql "postgres://postgres:YOUR_PASSWORD@localhost:5432/booksdb" -f db/indexes.sql
```

If `psql` is not installed, run the SQL from `db/indexes.sql` using your preferred DB tool.

## API Example

```txt
/api/books?q=dune&sort=popular&lang=en&limit=24
```

Supported query params:

- `q`
- `author`
- `lang`
- `genre`
- `sort` (`popular` | `rating` | `newest`)
- `limit` (max 48)
- `cursor`
- `minRating`
- `minRatings`
- `yearFrom`
- `yearTo`
