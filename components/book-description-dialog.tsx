"use client";

import { useEffect, useState } from "react";

type Props = {
  description: string;
  title?: string | null;
};

export function BookDescriptionDialog({ description, title }: Props) {
  const [open, setOpen] = useState(false);
  const shouldTruncate = description.length > 220;
  const previewText = shouldTruncate ? `${description.slice(0, 220).trimEnd()}...` : description;

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
        {previewText}
        {shouldTruncate ? (
          <>
            {" "}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline font-semibold text-[var(--accent)] hover:underline"
            >
              查看全文
            </button>
          </>
        ) : null}
      </p>

      {open ? (
        <div
          className="absolute inset-0 z-30 rounded-2xl bg-black/35 p-3 sm:p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={title ? `${title} 描述全文` : "图书描述全文"}
        >
          <div
            className="h-full rounded-xl border border-[var(--line)] bg-[color:rgba(255,250,240,0.96)] shadow-xl backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-full flex-col p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-[0.12em] text-[var(--muted)] uppercase">
                    描述全文
                  </p>
                  <h3 className="serif-title mt-1 line-clamp-2 text-lg font-bold text-[var(--ink)] sm:text-xl">
                    {title || "未命名"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="ghost-button rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--ink)]"
                >
                  关闭
                </button>
              </div>

              <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-xl border border-[var(--line)] bg-white/80 p-4">
                <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--ink)]">
                  {description}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
