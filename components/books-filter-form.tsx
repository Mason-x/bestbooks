"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FilterDropdownOption, SortKey } from "@/lib/books";
import { GenreCombobox } from "@/components/genre-combobox";
import { ALL_GENRE_OPTIONS } from "@/lib/all-genre-options";

type SortOption = { key: SortKey; label: string; help: string };

type QueryShape = {
  q: string;
  author: string;
  lang: string;
  genre: string;
  sort: SortKey;
  limit: number;
  minRating?: number;
  minRatings?: number;
  yearFrom?: number;
  yearTo?: number;
};

type Props = {
  query: QueryShape;
  sortOptions: SortOption[];
};

const YEAR_MIN = 1000;
const YEAR_MAX = 2100;
const MIN_RATING = 3.7;
const MAX_RATING = 5;

const DB_LANGUAGE_OPTIONS: FilterDropdownOption[] = [
  { value: "english", label: "英语（english）", count: 7152140 },
  { value: "spanish; castilian", label: "西班牙语（spanish; castilian）", count: 348868 },
  { value: "french", label: "法语（french）", count: 336712 },
  { value: "german", label: "德语（german）", count: 301252 },
  { value: "italian", label: "意大利语（italian）", count: 216164 },
  { value: "portuguese", label: "葡萄牙语（portuguese）", count: 133578 },
  { value: "dutch; flemish", label: "荷兰语（dutch; flemish）", count: 91538 },
  { value: "russian", label: "俄语（russian）", count: 81099 },
  { value: "polish", label: "波兰语（polish）", count: 73692 },
  { value: "chinese", label: "中文（chinese）", count: 66778 },
  { value: "turkish", label: "土耳其语（turkish）", count: 59679 },
  { value: "japanese", label: "日语（japanese）", count: 45195 },
  { value: "arabic", label: "阿拉伯语（arabic）", count: 44686 },
  { value: "czech", label: "捷克语（czech）", count: 36992 },
  { value: "swedish", label: "瑞典语（swedish）", count: 36251 },
  { value: "romanian", label: "罗马尼亚语（romanian）", count: 35199 },
  { value: "finnish", label: "芬兰语（finnish）", count: 27875 },
  { value: "danish", label: "丹麦语（danish）", count: 26985 },
  { value: "greek, modern (1453-)", label: "希腊语（greek, modern）", count: 25017 },
  { value: "hungarian", label: "匈牙利语（hungarian）", count: 24640 },
  { value: "persian", label: "波斯语（persian）", count: 23401 },
  { value: "bulgarian", label: "保加利亚语（bulgarian）", count: 22997 },
  { value: "serbian", label: "塞尔维亚语（serbian）", count: 20428 },
  { value: "indonesian", label: "印尼语（indonesian）", count: 20036 },
  { value: "norwegian", label: "挪威语（norwegian）", count: 14995 },
  { value: "croatian", label: "克罗地亚语（croatian）", count: 14244 },
  { value: "vietnamese", label: "越南语（vietnamese）", count: 13382 },
  { value: "estonian", label: "爱沙尼亚语（estonian）", count: 12845 },
  { value: "lithuanian", label: "立陶宛语（lithuanian）", count: 12789 },
  { value: "ukrainian", label: "乌克兰语（ukrainian）", count: 11821 },
];

const DB_GENRE_OPTIONS: FilterDropdownOption[] = ALL_GENRE_OPTIONS;

function withCurrentOption(options: FilterDropdownOption[], current: string) {
  if (!current) return options;
  if (options.some((option) => option.value === current)) return options;
  return [{ value: current, label: `当前选择（${current}）`, count: 0 }, ...options];
}

export function BooksFilterForm({ query, sortOptions }: Props) {
  const initialMinRating =
    query.minRating == null ? MIN_RATING : Math.min(MAX_RATING, Math.max(MIN_RATING, query.minRating));
  const [minRating, setMinRating] = useState<number>(initialMinRating);
  const [yearFrom, setYearFrom] = useState<number>(query.yearFrom ?? YEAR_MIN);
  const [yearTo, setYearTo] = useState<number>(query.yearTo ?? YEAR_MAX);
  const hasMinRatingFilter = minRating > MIN_RATING;
  const hasYearFromFilter = yearFrom !== YEAR_MIN;
  const hasYearToFilter = yearTo !== YEAR_MAX;

  const languages = useMemo(() => withCurrentOption(DB_LANGUAGE_OPTIONS, query.lang), [query.lang]);
  const genres = useMemo(() => withCurrentOption(DB_GENRE_OPTIONS, query.genre), [query.genre]);
  const ratingPercent = ((minRating - MIN_RATING) / (MAX_RATING - MIN_RATING)) * 100;
  const yearRangePercent = {
    left: ((yearFrom - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * 100,
    right: ((yearTo - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * 100,
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="serif-title text-lg font-bold">筛选</h2>
        <Link className="text-sm font-semibold text-[var(--accent)] hover:underline" href="/books">
          重置
        </Link>
      </div>

      <form action="/books" method="get" className="space-y-4">
        <div>
          <label htmlFor="q" className="mb-1 block text-sm font-semibold text-[var(--ink)]">
            搜索书名或作者
          </label>
          <input
            id="q"
            name="q"
            defaultValue={query.q}
            placeholder="例如：沙丘 / dune"
            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-[var(--accent)]"
          />
        </div>

        <div>
          <label htmlFor="author" className="mb-1 block text-sm font-semibold text-[var(--ink)]">
            作者包含
          </label>
          <input
            id="author"
            name="author"
            defaultValue={query.author}
            placeholder="例如：村上 / Murakami"
            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="lang" className="mb-1 block text-sm font-semibold text-[var(--ink)]">
              语言
            </label>
            <select
              id="lang"
              name="lang"
              defaultValue={query.lang}
              className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            >
              <option value="">全部</option>
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="genre" className="mb-1 block text-sm font-semibold text-[var(--ink)]">
              类型
            </label>
            <GenreCombobox id="genre" value={query.genre} options={genres} />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-white/75 p-3">
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="minRating" className="text-sm font-semibold text-[var(--ink)]">
              最低评分
            </label>
            <span className="text-sm font-semibold text-[var(--accent)]">{minRating.toFixed(1)}</span>
          </div>
          <div className="relative h-9">
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--line)]" />
            <div
              className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--accent)]"
              style={{ width: `${ratingPercent}%` }}
            />
            <input
              id="minRating"
              name={hasMinRatingFilter ? "minRating" : undefined}
              type="range"
              min={MIN_RATING}
              max={MAX_RATING}
              step={0.1}
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[var(--accent)] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-[var(--accent)] [&::-moz-range-thumb]:bg-white"
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-[var(--muted)]">
            <span>{MIN_RATING.toFixed(1)}</span>
            <span>{MAX_RATING.toFixed(1)}</span>
          </div>
        </div>

        <div>
          <label htmlFor="minRatings" className="mb-1 block text-sm font-semibold text-[var(--ink)]">
            最少评分人数
          </label>
          <input
            id="minRatings"
            name="minRatings"
            type="number"
            min={0}
            step={1}
            defaultValue={query.minRatings ?? ""}
            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-white/75 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--ink)]">出版年份范围</span>
            <span className="text-xs font-semibold text-[var(--accent)]">
              {yearFrom} - {yearTo}
            </span>
          </div>

          <input type="hidden" name={hasYearFromFilter ? "yearFrom" : undefined} value={yearFrom} />
          <input type="hidden" name={hasYearToFilter ? "yearTo" : undefined} value={yearTo} />

          <div className="mt-3">
            <div className="relative h-9">
              <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--line)]" />
              <div
                className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--accent)]"
                style={{
                  left: `${yearRangePercent.left}%`,
                  right: `${100 - yearRangePercent.right}%`,
                }}
              />
              <input
                aria-label="起始年份"
                type="range"
                min={YEAR_MIN}
                max={YEAR_MAX}
                step={1}
                value={yearFrom}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setYearFrom(Math.min(next, yearTo));
                }}
                className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[var(--accent)] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-[var(--accent)] [&::-moz-range-thumb]:bg-white"
              />
              <input
                aria-label="结束年份"
                type="range"
                min={YEAR_MIN}
                max={YEAR_MAX}
                step={1}
                value={yearTo}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setYearTo(Math.max(next, yearFrom));
                }}
                className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[var(--accent)] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-[var(--accent)] [&::-moz-range-thumb]:bg-white"
              />
            </div>
          </div>

          <div className="mt-1 flex justify-between text-xs text-[var(--muted)]">
            <span>{YEAR_MIN}</span>
            <span>{YEAR_MAX}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="sort" className="mb-1 block text-sm font-semibold text-[var(--ink)]">
              排序
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={query.sort}
              className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            >
              {sortOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="limit" className="mb-1 block text-sm font-semibold text-[var(--ink)]">
              每页数量
            </label>
            <select
              id="limit"
              name="limit"
              defaultValue={query.limit}
              className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            >
              {[12, 24, 36, 48].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="accent-button w-full rounded-lg px-4 py-2.5 text-sm font-semibold">
          应用筛选
        </button>
      </form>
    </>
  );
}
