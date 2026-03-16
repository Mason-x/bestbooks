"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FilterDropdownOption } from "@/lib/books";

type Props = {
  options: FilterDropdownOption[];
  value: string;
  name?: string;
  id?: string;
};

function getDisplayLabel(options: FilterDropdownOption[], value: string): string {
  if (!value) return "";
  const match = options.find((option) => option.value === value);
  return match ? match.label : value;
}

export function GenreCombobox({
  options,
  value,
  name = "genre",
  id = "genre",
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>(value);
  const [inputValue, setInputValue] = useState<string>(() => getDisplayLabel(options, value));

  useEffect(() => {
    setSelectedValue(value);
    setInputValue(getDisplayLabel(options, value));
  }, [options, value]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!rootRef.current || !target) return;
      if (!rootRef.current.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const filtered = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return options.slice(0, 80);
    return options
      .filter((option) => {
        const label = option.label.toLowerCase();
        const raw = option.value.toLowerCase();
        return label.includes(q) || raw.includes(q);
      })
      .slice(0, 80);
  }, [options, inputValue]);

  function handleSelect(option: FilterDropdownOption) {
    setSelectedValue(option.value);
    setInputValue(option.label);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name={name} value={selectedValue} />
      <input
        id={id}
        type="text"
        value={inputValue}
        placeholder="搜索类型（中文/英文）"
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setInputValue(e.target.value);
          setOpen(true);
          const exact =
            options.find((option) => option.label === e.target.value) ??
            options.find((option) => option.value === e.target.value);
          setSelectedValue(exact?.value ?? "");
        }}
        className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
      />

      {open ? (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--panel)] p-1 shadow-lg">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setSelectedValue("");
              setInputValue("");
              setOpen(false);
            }}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--muted)] hover:bg-white/80"
          >
            全部类型
          </button>

          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-[var(--muted)]">没有匹配的类型</div>
          ) : (
            filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(option)}
                className={[
                  "block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/80",
                  selectedValue === option.value ? "bg-white text-[var(--ink)]" : "text-[var(--muted)]",
                ].join(" ")}
                title={option.value}
              >
                <span className="font-medium text-[var(--ink)]">{option.label}</span>
                <span className="ml-2 text-xs text-[var(--muted)]">({option.count.toLocaleString()})</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
