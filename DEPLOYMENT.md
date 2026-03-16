# BestBooks Deployment

## Current project assumptions

- The app reads `DATABASE_URL` from the runtime environment.
- All book queries hit `public.books`.
- The app does not include an ORM migration framework. Database migration for this project means:
  - move the PostgreSQL schema/data to the target server;
  - create the recommended indexes after restore if they are not already present.

Relevant files:

- `lib/db.ts`
- `lib/books.ts`
- `db/indexes.sql`

## 1. Prepare the server

Install Docker Engine and Docker Compose v2 on the server, then upload or clone the repository.

Example:

```bash
git clone <your-repo-url> bestbooks
cd bestbooks
```

## 2. Configure environment variables

Create a `.env` file next to `docker-compose.yml`.

If you want Docker to run both the app and PostgreSQL:

```env
APP_PORT=3000
POSTGRES_PORT=5432
POSTGRES_DB=booksdb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_this_password
DATABASE_URL=postgres://postgres:change_this_password@db:5432/booksdb
```

If you already have an external PostgreSQL server:

```env
APP_PORT=3000
DATABASE_URL=postgres://postgres:your_password@your-db-host:5432/booksdb
```

In the external-DB case, remove the `db` service and `depends_on` block from `docker-compose.yml`, or create an override file for production.

## 3. Build and start the containers

```bash
docker compose build
docker compose up -d
docker compose ps
```

Check the app:

```bash
curl http://127.0.0.1:3000/books
```

## 4. Database migration

### Option A: migrate an existing PostgreSQL database to the target server

This is the correct path when your source machine already has the real `booksdb.public.books` data.

1. Export from the source database:

```bash
pg_dump -Fc \
  -d "postgres://postgres:source_password@source-host:5432/booksdb" \
  -f booksdb.dump
```

If you only want the application table:

```bash
pg_dump -Fc \
  -d "postgres://postgres:source_password@source-host:5432/booksdb" \
  -t public.books \
  -f books_only.dump
```

2. Copy the dump to the target server.

3. Restore into the target PostgreSQL:

If the target DB runs in Docker:

```bash
docker cp booksdb.dump bestbooks-db:/tmp/booksdb.dump
docker exec -it bestbooks-db createdb -U postgres booksdb
docker exec -it bestbooks-db pg_restore \
  -U postgres \
  -d booksdb \
  --no-owner \
  --no-privileges \
  -j 4 \
  /tmp/booksdb.dump
```

If the target DB is external:

```bash
pg_restore \
  -d "postgres://postgres:target_password@target-host:5432/booksdb" \
  --no-owner \
  --no-privileges \
  -j 4 \
  booksdb.dump
```

### Option B: initialize a fresh target database and import data another way

If your source data is CSV or SQL instead of an existing PostgreSQL instance, import it into `public.books` first, then continue with the indexing step below.

## 5. Create the recommended indexes

The project expects a large `public.books` table and ships index SQL in `db/indexes.sql`.

Run it after restore:

If PostgreSQL runs in Docker:

```bash
docker exec -i bestbooks-db psql \
  -U postgres \
  -d booksdb \
  < db/indexes.sql
```

If PostgreSQL is external:

```bash
psql "postgres://postgres:target_password@target-host:5432/booksdb" -f db/indexes.sql
```

Notes:

- `CREATE INDEX CONCURRENTLY` can take a long time on a 10M+ row table.
- `CREATE INDEX CONCURRENTLY` cannot run inside a transaction block.
- Running `ANALYZE public.books;` at the end is already included in `db/indexes.sql`.

## 6. What schema the app expects

Queries in `lib/books.ts` assume at least these columns exist on `public.books`:

- `book_id` (treated as bigint in pagination comparisons)
- `cover_image_url`
- `book_title`
- `in_language`
- `author_name`
- `rating_value`
- `rating_count` (treated as bigint)
- `review_count`
- `publication_date` (treated as date)
- `number_of_pages`
- `description`
- `genres` (must support `text[]` operations)
- `isbn`

If these columns or types differ on the target database, the app will start but the `/books` page and `/api/books` endpoint will fail at query time.

## 7. Update and restart

When you deploy a new version:

```bash
git pull
docker compose build
docker compose up -d
```

View logs:

```bash
docker compose logs -f app
docker compose logs -f db
```
