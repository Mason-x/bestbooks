import { z } from "zod";
import { getDb } from "@/lib/db";

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 48;
const DEFAULT_SORT = "popular" as const;

export type SortKey = "popular" | "rating" | "newest";

const searchParamInputSchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
  author: z.string().trim().max(120).optional().default(""),
  lang: z.string().trim().max(32).optional().default(""),
  genre: z.string().trim().max(64).optional().default(""),
  sort: z.enum(["popular", "rating", "newest"]).optional().default(DEFAULT_SORT),
  cursor: z.string().trim().max(500).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).optional().default(DEFAULT_LIMIT),
  minRating: z.coerce.number().min(0).max(5).optional(),
  minRatings: z.coerce.number().int().min(0).max(2_147_483_647).optional(),
  yearFrom: z.coerce.number().int().min(1000).max(2100).optional(),
  yearTo: z.coerce.number().int().min(1000).max(2100).optional(),
});

export type BooksQueryParams = z.infer<typeof searchParamInputSchema>;

type PopularCursor = { s: "popular"; rc: string; id: string };
type RatingCursor = { s: "rating"; rv: number; rc: string; id: string };
type NewestCursor = { s: "newest"; pd: string; id: string };
type CursorPayload = PopularCursor | RatingCursor | NewestCursor;

export type BookListItem = {
  bookId: string;
  coverImageUrl: string | null;
  bookTitle: string | null;
  inLanguage: string | null;
  authorName: string | null;
  ratingValue: number | null;
  ratingCount: string | null;
  reviewCount: string | null;
  publicationDate: string | null;
  numberOfPages: number | null;
  description: string | null;
  genres: string[];
  isbn: string | null;
};

export type BooksListResponse = {
  items: BookListItem[];
  nextCursor: string | null;
  hasMore: boolean;
  query: Omit<BooksQueryParams, "cursor"> & { cursor?: string };
};

export type FilterDropdownOption = {
  value: string;
  label: string;
  count: number;
};

export type BooksFilterOptions = {
  languages: FilterDropdownOption[];
  genres: FilterDropdownOption[];
};

type QueryBuilderContext = {
  where: string[];
  params: unknown[];
  push: (value: unknown) => string;
};

type RawBookRow = {
  book_id: string;
  cover_image_url: string | null;
  book_title: string | null;
  in_language: string | null;
  author_name: string | null;
  rating_value: number | null;
  rating_count: string | null;
  review_count: string | null;
  publication_date: string | Date | null;
  number_of_pages: number | null;
  description: string | null;
  genres: string[] | null;
  isbn: string | null;
  _sort_rv: number;
  _sort_rc: string;
  _sort_pd: string | Date;
};

type RawFilterRow = {
  value: string;
  count: string;
};

declare global {
  var __bestBooksFilterOptionsCache:
    | { expiresAt: number; data: BooksFilterOptions }
    | undefined;
}

const FILTER_OPTIONS_TTL_MS = 60 * 60 * 1000;

const LANGUAGE_LABELS_ZH: Record<string, string> = {
  en: "英语",
  zh: "中文",
  "zh-cn": "简体中文",
  "zh-hans": "简体中文",
  "zh-tw": "繁体中文",
  "zh-hant": "繁体中文",
  ja: "日语",
  ko: "韩语",
  fr: "法语",
  de: "德语",
  es: "西班牙语",
  it: "意大利语",
  pt: "葡萄牙语",
  ru: "俄语",
  ar: "阿拉伯语",
  nl: "荷兰语",
  pl: "波兰语",
  sv: "瑞典语",
  no: "挪威语",
  da: "丹麦语",
  fi: "芬兰语",
  tr: "土耳其语",
  hi: "印地语",
  th: "泰语",
  vi: "越南语",
  id: "印度尼西亚语",
  ms: "马来语",
  uk: "乌克兰语",
  cs: "捷克语",
  el: "希腊语",
  he: "希伯来语",
  ro: "罗马尼亚语",
  hu: "匈牙利语",
};

const GENRE_LABELS_ZH: Record<string, string> = {
  fiction: "小说",
  nonfiction: "非虚构",
  fantasy: "奇幻",
  "science fiction": "科幻",
  "sci-fi": "科幻",
  romance: "言情",
  mystery: "悬疑",
  thriller: "惊悚",
  horror: "恐怖",
  classics: "经典",
  classic: "经典",
  history: "历史",
  historical: "历史",
  "historical fiction": "历史小说",
  biography: "传记",
  memoir: "回忆录",
  autobiography: "自传",
  poetry: "诗歌",
  literature: "文学",
  "young adult": "青少年",
  ya: "青少年",
  children: "儿童",
  "children's": "儿童",
  kids: "儿童",
  "middle grade": "中少儿",
  adventure: "冒险",
  drama: "戏剧",
  crime: "犯罪",
  detective: "侦探",
  humor: "幽默",
  humour: "幽默",
  comics: "漫画",
  manga: "漫画",
  graphic: "图像小说",
  "graphic novels": "图像小说",
  philosophy: "哲学",
  psychology: "心理学",
  religion: "宗教",
  spirituality: "灵修",
  selfhelp: "自助成长",
  "self-help": "自助成长",
  business: "商业",
  economics: "经济",
  politics: "政治",
  education: "教育",
  "true crime": "真实犯罪",
  cookbook: "烹饪",
  cooking: "烹饪",
  art: "艺术",
  music: "音乐",
  travel: "旅行",
  sports: "体育",
  war: "战争",
  medical: "医学",
};

function parseCount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeGenreKey(value: string): string {
  return value.trim().toLowerCase();
}

function toChineseLanguageLabel(value: string): string {
  const normalized = value.trim().toLowerCase();
  const label = LANGUAGE_LABELS_ZH[normalized];
  return label ? `${label}（${value}）` : `未翻译（${value}）`;
}

function toChineseGenreLabel(value: string): string {
  const normalized = normalizeGenreKey(value);
  const label = GENRE_LABELS_ZH[normalized];
  return label ?? `未翻译（${value}）`;
}

async function fetchLanguageOptions(): Promise<FilterDropdownOption[]> {
  const sql = `
    SELECT lower(btrim(in_language)) AS value, COUNT(*)::bigint AS count
    FROM public.books
    WHERE in_language IS NOT NULL
      AND btrim(in_language) <> ''
    GROUP BY 1
    ORDER BY COUNT(*) DESC, 1 ASC
    LIMIT 40
  `;

  const result = await getDb().query<RawFilterRow>(sql);
  return result.rows.map((row) => ({
    value: row.value,
    label: toChineseLanguageLabel(row.value),
    count: parseCount(row.count),
  }));
}

async function fetchGenreOptions(): Promise<FilterDropdownOption[]> {
  const sql = `
    SELECT btrim(g.genre) AS value, COUNT(*)::bigint AS count
    FROM public.books AS b
    CROSS JOIN LATERAL unnest(b.genres) AS g(genre)
    WHERE g.genre IS NOT NULL
      AND btrim(g.genre) <> ''
    GROUP BY 1
    ORDER BY COUNT(*) DESC, 1 ASC
    LIMIT 60
  `;

  const result = await getDb().query<RawFilterRow>(sql);
  return result.rows.map((row) => ({
    value: row.value,
    label: toChineseGenreLabel(row.value),
    count: parseCount(row.count),
  }));
}

function coerceEmptyToUndefined(value: unknown) {
  if (value === "" || value == null) return undefined;
  return value;
}

function normalizeRawSearchParams(input: Record<string, string | string[] | undefined>) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    const first = Array.isArray(value) ? value[0] : value;
    out[key] = coerceEmptyToUndefined(first);
  }
  return out;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseCursor(cursor: string | undefined): CursorPayload | null {
  if (!cursor) return null;

  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed: unknown = JSON.parse(decoded);
    if (!isRecord(parsed) || typeof parsed.s !== "string") return null;

    if (
      parsed.s === "popular" &&
      typeof parsed.rc === "string" &&
      typeof parsed.id === "string"
    ) {
      return { s: "popular", rc: parsed.rc, id: parsed.id };
    }

    if (
      parsed.s === "rating" &&
      typeof parsed.rv === "number" &&
      typeof parsed.rc === "string" &&
      typeof parsed.id === "string"
    ) {
      return { s: "rating", rv: parsed.rv, rc: parsed.rc, id: parsed.id };
    }

    if (
      parsed.s === "newest" &&
      typeof parsed.pd === "string" &&
      typeof parsed.id === "string"
    ) {
      return { s: "newest", pd: parsed.pd, id: parsed.id };
    }

    return null;
  } catch {
    return null;
  }
}

function encodeCursor(cursor: CursorPayload): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function addFilters(query: BooksQueryParams, ctx: QueryBuilderContext) {
  const { where, push } = ctx;

  if (query.q) {
    const pattern = `%${query.q}%`;
    const p1 = push(pattern);
    const p2 = push(pattern);
    where.push(`(book_title ILIKE ${p1} OR author_name ILIKE ${p2})`);
  }

  if (query.author) {
    const p = push(`%${query.author}%`);
    where.push(`author_name ILIKE ${p}`);
  }

  if (query.lang) {
    const p = push(query.lang.toLowerCase());
    where.push(`lower(in_language) = ${p}`);
  }

  if (query.genre) {
    const p = push(query.genre);
    where.push(`genres @> ARRAY[${p}]::text[]`);
  }

  if (query.minRating != null) {
    const p = push(query.minRating);
    where.push(`COALESCE(rating_value, 0) >= ${p}`);
  }

  if (query.minRatings != null) {
    const p = push(String(query.minRatings));
    where.push(`COALESCE(rating_count, 0) >= ${p}::bigint`);
  }

  if (query.yearFrom != null) {
    const p = push(`${query.yearFrom}-01-01`);
    where.push(`publication_date >= ${p}::date`);
  }

  if (query.yearTo != null) {
    const p = push(`${query.yearTo + 1}-01-01`);
    where.push(`publication_date < ${p}::date`);
  }
}

function addCursorClause(
  query: BooksQueryParams,
  cursor: CursorPayload | null,
  ctx: QueryBuilderContext,
): { orderBySql: string } {
  const rcExpr = "COALESCE(rating_count, 0)";
  const rvExpr = "COALESCE(rating_value, 0)";
  const pdExpr = "COALESCE(publication_date, DATE '0001-01-01')";
  const { where, push } = ctx;

  switch (query.sort) {
    case "rating": {
      if (cursor?.s === "rating") {
        const rv = push(cursor.rv);
        const rc = push(cursor.rc);
        const id = push(cursor.id);
        where.push(`(${rvExpr}, ${rcExpr}, book_id) < (${rv}, ${rc}::bigint, ${id}::bigint)`);
      }
      return { orderBySql: `${rvExpr} DESC, ${rcExpr} DESC, book_id DESC` };
    }
    case "newest": {
      if (cursor?.s === "newest") {
        const pd = push(cursor.pd || "0001-01-01");
        const id = push(cursor.id);
        where.push(`(${pdExpr}, book_id) < (${pd}::date, ${id}::bigint)`);
      }
      return { orderBySql: `${pdExpr} DESC, book_id DESC` };
    }
    case "popular":
    default: {
      if (cursor?.s === "popular") {
        const rc = push(cursor.rc);
        const id = push(cursor.id);
        where.push(`(${rcExpr}, book_id) < (${rc}::bigint, ${id}::bigint)`);
      }
      return { orderBySql: `${rcExpr} DESC, book_id DESC` };
    }
  }
}

function toBookItem(row: RawBookRow): BookListItem {
  const value =
    row.rating_value == null || Number.isNaN(Number(row.rating_value))
      ? null
      : Number(row.rating_value);
  const publicationDate =
    row.publication_date instanceof Date
      ? row.publication_date.toISOString().slice(0, 10)
      : row.publication_date;

  return {
    bookId: row.book_id,
    coverImageUrl: row.cover_image_url,
    bookTitle: row.book_title,
    inLanguage: row.in_language,
    authorName: row.author_name,
    ratingValue: value,
    ratingCount: row.rating_count,
    reviewCount: row.review_count,
    publicationDate,
    numberOfPages: row.number_of_pages,
    description: row.description,
    genres: row.genres ?? [],
    isbn: row.isbn,
  };
}

function cursorFromRow(sort: SortKey, row: RawBookRow): CursorPayload {
  const sortDate =
    row._sort_pd instanceof Date ? row._sort_pd.toISOString().slice(0, 10) : row._sort_pd;

  switch (sort) {
    case "rating":
      return { s: "rating", rv: Number(row._sort_rv ?? 0), rc: row._sort_rc ?? "0", id: row.book_id };
    case "newest":
      return { s: "newest", pd: sortDate ?? "0001-01-01", id: row.book_id };
    case "popular":
    default:
      return { s: "popular", rc: row._sort_rc ?? "0", id: row.book_id };
  }
}

function validateCrossFields(data: BooksQueryParams) {
  if (data.yearFrom != null && data.yearTo != null && data.yearFrom > data.yearTo) {
    throw new Error("yearFrom must be less than or equal to yearTo");
  }
}

export function safeParseBooksQueryParams(input: Record<string, string | string[] | undefined>) {
  const normalized = normalizeRawSearchParams(input);
  const parsed = searchParamInputSchema.safeParse(normalized);

  if (!parsed.success) return parsed;

  try {
    validateCrossFields(parsed.data);
    return { success: true as const, data: parsed.data };
  } catch (error) {
    return {
      success: false as const,
      error: new z.ZodError([
        {
          code: "custom",
          message: error instanceof Error ? error.message : "Invalid parameters",
          path: ["yearFrom"],
        },
      ]),
    };
  }
}

export function normalizeBooksQueryParams(
  input: Record<string, string | string[] | undefined>,
): BooksQueryParams {
  const parsed = safeParseBooksQueryParams(input);

  if (parsed.success) {
    return parsed.data;
  }

  return {
    q: "",
    author: "",
    lang: "",
    genre: "",
    sort: DEFAULT_SORT,
    cursor: undefined,
    limit: DEFAULT_LIMIT,
    minRating: undefined,
    minRatings: undefined,
    yearFrom: undefined,
    yearTo: undefined,
  };
}

export async function getBooksList(query: BooksQueryParams): Promise<BooksListResponse> {
  const cursor = parseCursor(query.cursor);
  const where: string[] = [];
  const params: unknown[] = [];
  const push = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };

  addFilters(query, { where, params, push });
  const { orderBySql } = addCursorClause(query, cursor, { where, params, push });

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const limitSql = push(query.limit + 1);

  const sql = `
    SELECT
      book_id,
      cover_image_url,
      book_title,
      in_language,
      author_name,
      rating_value,
      rating_count,
      review_count,
      publication_date,
      number_of_pages,
      description,
      genres,
      isbn,
      COALESCE(rating_value, 0) AS _sort_rv,
      COALESCE(rating_count, 0) AS _sort_rc,
      COALESCE(publication_date, DATE '0001-01-01') AS _sort_pd
    FROM public.books
    ${whereSql}
    ORDER BY ${orderBySql}
    LIMIT ${limitSql}
  `;

  const result = await getDb().query<RawBookRow>(sql, params);
  const hasMore = result.rows.length > query.limit;
  const pageRows = hasMore ? result.rows.slice(0, query.limit) : result.rows;

  return {
    items: pageRows.map(toBookItem),
    nextCursor:
      hasMore && pageRows.length > 0
        ? encodeCursor(cursorFromRow(query.sort, pageRows[pageRows.length - 1]))
        : null,
    hasMore,
    query: {
      q: query.q,
      author: query.author,
      lang: query.lang,
      genre: query.genre,
      sort: query.sort,
      limit: query.limit,
      minRating: query.minRating,
      minRatings: query.minRatings,
      yearFrom: query.yearFrom,
      yearTo: query.yearTo,
      cursor: query.cursor,
    },
  };
}

export async function getBooksFilterOptions(): Promise<BooksFilterOptions> {
  const now = Date.now();
  const cached = global.__bestBooksFilterOptionsCache;
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const [languages, genres] = await Promise.all([fetchLanguageOptions(), fetchGenreOptions()]);
  const data: BooksFilterOptions = { languages, genres };

  global.__bestBooksFilterOptionsCache = {
    data,
    expiresAt: now + FILTER_OPTIONS_TTL_MS,
  };

  return data;
}
