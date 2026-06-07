"use client";

import { useEffect, useId, useRef, useState } from "react";

export type PositionSelection = {
  id?: string;
  title: string;
};

type PositionPickerProps = {
  companyId?: string;
  companySelected?: boolean;
  value: PositionSelection;
  onChange: (value: PositionSelection) => void;
  label?: string;
  required?: boolean;
  id?: string;
  disabled?: boolean;
};

export function PositionPicker({
  companyId,
  companySelected = false,
  value,
  onChange,
  label = "Position",
  required = false,
  id,
  disabled = false,
}: PositionPickerProps) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const [query, setQuery] = useState(value.title);
  const [suggestions, setSuggestions] = useState<
    { id: string; title: string }[]
  >([]);
  const [open, setOpen] = useState(false);
  const blurTimeout = useRef<number | null>(null);

  useEffect(() => {
    setQuery(value.title);
  }, [value.id, value.title]);

  useEffect(() => {
    if (!companyId) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const res = await fetch(
        `/api/companies/${companyId}/positions?q=${encodeURIComponent(query)}`,
        { signal: controller.signal },
      );
      if (!res.ok) return;
      const data = await res.json();
      setSuggestions(data.positions ?? []);
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [companyId, query]);

  function selectPosition(position: { id: string; title: string }) {
    onChange({ id: position.id, title: position.title });
    setQuery(position.title);
    setOpen(false);
  }

  const inputDisabled = disabled || !companySelected;

  return (
    <div className="relative">
      <label
        htmlFor={inputId}
        className="mb-1 block text-sm font-medium text-stone-700"
      >
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      <input
        id={inputId}
        value={query}
        disabled={inputDisabled}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange({ title: e.target.value });
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimeout.current = window.setTimeout(() => setOpen(false), 150);
        }}
        placeholder={
          companySelected
            ? "Start typing a position title"
            : "Select a company first"
        }
        required={required}
        autoComplete="off"
        className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base disabled:bg-stone-100"
      />

      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
          {suggestions.map((position) => (
            <li key={position.id}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-emerald-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectPosition(position)}
              >
                {position.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
