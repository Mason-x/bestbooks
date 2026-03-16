"use client";

import { useEffect, useRef, useState } from "react";
import type { BookListItem } from "@/lib/books";
import { BookDescriptionDialog } from "@/components/book-description-dialog";

type BaseParams = Partial<Record<string, string | number | undefined>>;

type Props = {
  initialItems: BookListItem[];
  initialNextCursor: string | null;
  initialHasMore: boolean;
  baseParams: BaseParams;
};

type BooksApiResponse = {
  items: BookListItem[];
  nextCursor: string | null;
  hasMore: boolean;
};

function formatCompact(value: string | null): string {
  if (!value) return "-";
  try {
    const BILLION = BigInt("1000000000");
    const MILLION = BigInt("1000000");
    const THOUSAND = BigInt("1000");
    const DIV_B = BigInt("10000000");
    const DIV_M = BigInt("10000");
    const DIV_K = BigInt("10");
    const n = BigInt(value);
    if (n >= BILLION) return `${Number(n / DIV_B) / 100}B`;
    if (n >= MILLION) return `${Number(n / DIV_M) / 100}M`;
    if (n >= THOUSAND) return `${Number(n / DIV_K) / 100}K`;
    return n.toString();
  } catch {
    return value;
  }
}

function ratingStars(rating: number | null): string {
  if (rating == null) return "☆☆☆☆☆";
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return `${"⭐".repeat(filled)}${"☆".repeat(5 - filled)}`;
}

function sanitizeImage(url: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return null;
}

function queryStringFrom(params: BaseParams): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    const text = String(value).trim();
    if (!text) continue;
    sp.set(key, text);
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export function BooksListClient({
  initialItems,
  initialNextCursor,
  initialHasMore,
  baseParams,
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  async function loadMore() {
    if (isLoading || !hasMore || !nextCursor) return;

    setIsLoading(true);
    setLoadError(null);

    try {
      const url = `/api/books${queryStringFrom({ ...baseParams, cursor: nextCursor })}`;
      const response = await fetch(url, { method: "GET" });
      if (!response.ok) {
        throw new Error(`请求失败（${response.status}）`);
      }

      const payload = (await response.json()) as BooksApiResponse;
      setItems((prev) => [...prev, ...payload.items]);
      setNextCursor(payload.nextCursor);
      setHasMore(payload.hasMore);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((entry) => entry.isIntersecting);
        if (hit) {
          void loadMore();
        }
      },
      {
        root: null,
        rootMargin: "400px 0px",
        threshold: 0,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, nextCursor, isLoading]);

  return (
    <>
      <ol className="mt-4 space-y-4">
        {items.map((book) => {
          const imageUrl = sanitizeImage(book.coverImageUrl);
          const goodreadsUrl = `https://www.goodreads.com/book/show/${book.bookId}`;
          return (
            <li key={book.bookId} className="book-card relative rounded-2xl p-4 sm:p-5">
              <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-4 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-5">
                <a
                  href={goodreadsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-[2/3] overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel)] transition hover:shadow-md"
                  title="在 Goodreads 打开"
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={book.bookTitle ? `${book.bookTitle} cover` : "Book cover"}
                      loading="lazy"
                      width={112}
                      height={168}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-3 text-center text-xs font-semibold text-[var(--muted)]">
                      暂无封面
                    </div>
                  )}
                </a>

                <div className="min-w-0">
                  <div className="relative min-h-14 min-w-0 pr-28 sm:pr-32">
                    <div className="min-w-0">
                      <h3 className="serif-title line-clamp-2 text-lg font-bold leading-snug sm:text-xl">
                        <a
                          href={goodreadsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[var(--accent)] hover:underline"
                          title="在 Goodreads 打开"
                        >
                          {book.bookTitle || "未命名"}
                        </a>
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        作者：
                        <span className="font-semibold text-[var(--ink)]">
                          {book.authorName || "未知作者"}
                        </span>
                      </p>
                    </div>
                    <div className="absolute right-0 top-0 rounded-lg border border-[var(--line)] bg-white/70 px-3 py-2 text-right text-sm">
                      <div className="font-semibold text-[var(--ink)]">
                        {book.ratingValue != null ? book.ratingValue.toFixed(2) : "-"} / 5
                      </div>
                      <div className="text-xs tracking-wide text-[var(--muted)]">
                        {ratingStars(book.ratingValue)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
                    <span>评分人数：{formatCompact(book.ratingCount)}</span>
                    <span>评论数：{formatCompact(book.reviewCount)}</span>
                    <span>页数：{book.numberOfPages ?? "-"}</span>
                    <span>出版日期：{book.publicationDate ?? "-"}</span>
                    <span>语言：{book.inLanguage || "-"}</span>
                    <span>ISBN：{book.isbn || "-"}</span>
                  </div>

                  {book.genres.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {book.genres.slice(0, 6).map((genre) => (
                        <span
                          key={`${book.bookId}-${genre}`}
                          className="rounded-full border border-[var(--line)] bg-white/80 px-2.5 py-1 text-xs font-semibold text-[var(--muted)]"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {book.description ? (
                    <BookDescriptionDialog description={book.description} title={book.bookTitle} />
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 flex flex-col items-center justify-center gap-2">
        {isLoading ? (
          <div className="ghost-button rounded-full px-4 py-2 text-sm font-semibold text-[var(--muted)]">
            正在自动加载更多...
          </div>
        ) : null}

        {!hasMore ? (
          <div className="ghost-button rounded-full px-4 py-2 text-sm font-semibold text-[var(--muted)]">
            已到末页
          </div>
        ) : null}

        {loadError ? <p className="text-sm text-red-700">自动加载失败：{loadError}</p> : null}
      </div>

      <div ref={sentinelRef} className="h-6" aria-hidden="true" />
    </>
  );
}
