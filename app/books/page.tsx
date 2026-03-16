import Link from "next/link";
import type { Metadata } from "next";
import {
  getBooksList,
  normalizeBooksQueryParams,
  type BooksQueryParams,
  type SortKey,
} from "@/lib/books";
import { BooksFilterForm } from "@/components/books-filter-form";
import { BooksListClient } from "@/components/books-list-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "图书列表 | BestBooks",
};

type SearchParamValue = string | string[] | undefined;
type PageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

const sortOptions: Array<{ key: SortKey; label: string; help: string }> = [
  { key: "popular", label: "热门", help: "按评分人数排序" },
  { key: "rating", label: "高分", help: "按评分和评分人数排序" },
  { key: "newest", label: "最新", help: "按出版日期排序" },
];

function queryStringFrom(params: Partial<Record<string, string | number | undefined>>): string {
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

function paramsWithoutCursor(query: BooksQueryParams): Partial<Record<string, string | number | undefined>> {
  return {
    q: query.q || undefined,
    author: query.author || undefined,
    lang: query.lang || undefined,
    genre: query.genre || undefined,
    minRating: query.minRating,
    minRatings: query.minRatings,
    yearFrom: query.yearFrom,
    yearTo: query.yearTo,
    sort: query.sort,
    limit: query.limit,
  };
}

export default async function BooksPage({ searchParams }: PageProps) {
  const rawSearchParams = await searchParams;
  const query = normalizeBooksQueryParams(rawSearchParams);
  const baseParams = paramsWithoutCursor(query);

  let dataError: string | null = null;
  let data: Awaited<ReturnType<typeof getBooksList>> | null = null;

  try {
    data = await getBooksList(query);
  } catch (error) {
    dataError = error instanceof Error ? error.message : "Unknown database error";
  }

  const sortLinks = sortOptions.map((option) => ({
    ...option,
    href: `/books${queryStringFrom({ ...baseParams, sort: option.key })}`,
    active: query.sort === option.key,
  }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="subtle-panel h-fit rounded-2xl p-4 sm:p-5">
          <BooksFilterForm query={query} sortOptions={sortOptions} />
        </aside>

        <section>
          <div className="subtle-panel rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="serif-title text-xl font-bold">图书列表</h2>
                <p className="text-sm text-[var(--muted)]">
                  {data
                    ? `首屏已加载 ${data.items.length} 条${data.hasMore ? "（支持加载更多）" : ""}`
                    : "等待数据库响应中"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {sortLinks.map((option) => (
                  <Link
                    key={option.key}
                    href={option.href}
                    title={option.help}
                    className={[
                      "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
                      option.active ? "bg-[var(--accent)] text-white" : "ghost-button text-[var(--ink)]",
                    ].join(" ")}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {dataError ? (
            <div className="book-card mt-4 rounded-2xl p-5 text-sm text-red-700">
              <p className="font-semibold">数据库错误</p>
              <p className="mt-2 break-words">{dataError}</p>
              <p className="mt-3 text-[var(--muted)]">
                请检查 <code className="font-mono">.env.local</code> 中的{" "}
                <code className="font-mono">DATABASE_URL</code>。
              </p>
            </div>
          ) : null}

          {!dataError && data && data.items.length === 0 ? (
            <div className="book-card mt-4 rounded-2xl p-6">
              <p className="serif-title text-lg font-bold">没有匹配当前筛选条件的图书。</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                建议先移除“类型”筛选，再逐步放宽作者或书名关键词。
              </p>
            </div>
          ) : null}

          {!dataError && data ? (
            <BooksListClient
              initialItems={data.items}
              initialNextCursor={data.nextCursor}
              initialHasMore={data.hasMore}
              baseParams={baseParams}
            />
          ) : null}
        </section>
      </div>
    </main>
  );
}
