-- Recommended indexes for fast Goodreads-style list browsing on public.books (~10M+ rows).
-- Run these in psql or another SQL client.
-- CREATE INDEX CONCURRENTLY may run for a long time on this dataset.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Sorting indexes (used by keyset pagination paths)
CREATE INDEX CONCURRENTLY IF NOT EXISTS books_popular_sort_idx
ON public.books ((COALESCE(rating_count, 0)) DESC, book_id DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS books_rating_sort_idx
ON public.books ((COALESCE(rating_value, 0)) DESC, (COALESCE(rating_count, 0)) DESC, book_id DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS books_newest_sort_idx
ON public.books ((COALESCE(publication_date, DATE '0001-01-01')) DESC, book_id DESC);

-- Common filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS books_language_lower_idx
ON public.books (lower(in_language))
WHERE in_language IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS books_genres_gin_idx
ON public.books USING GIN (genres);

-- Search helpers (ILIKE on title / author)
CREATE INDEX CONCURRENTLY IF NOT EXISTS books_title_trgm_idx
ON public.books USING GIN (book_title gin_trgm_ops)
WHERE book_title IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS books_author_trgm_idx
ON public.books USING GIN (author_name gin_trgm_ops)
WHERE author_name IS NOT NULL;

ANALYZE public.books;
