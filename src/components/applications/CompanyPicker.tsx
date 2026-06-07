"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/Button";

export type CompanySelection = {
  id?: string;
  name: string;
};

type SimilarCompany = {
  id: string;
  name: string;
  score: number;
};

type CompanyPickerProps = {
  value: CompanySelection;
  onChange: (value: CompanySelection) => void;
  onSimilarityOverrideChange?: (override: boolean) => void;
  onSimilarityWarningChange?: (blocked: boolean) => void;
  similarOverride?: boolean;
  label?: string;
  required?: boolean;
  id?: string;
};

export function CompanyPicker({
  value,
  onChange,
  onSimilarityOverrideChange,
  onSimilarityWarningChange,
  similarOverride = false,
  label = "Company",
  required = false,
  id,
}: CompanyPickerProps) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const [query, setQuery] = useState(value.name);
  const [suggestions, setSuggestions] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [similar, setSimilar] = useState<SimilarCompany[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const blurTimeout = useRef<number | null>(null);

  useEffect(() => {
    setQuery(value.name);
  }, [value.id, value.name]);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setSimilar([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const [searchRes, similarRes] = await Promise.all([
          fetch(`/api/companies?q=${encodeURIComponent(query)}`, {
            signal: controller.signal,
          }),
          fetch(
            `/api/companies?similarTo=${encodeURIComponent(query)}`,
            { signal: controller.signal },
          ),
        ]);

        if (searchRes.ok) {
          const data = await searchRes.json();
          setSuggestions(data.companies ?? []);
        }

        if (similarRes.ok) {
          const data = await similarRes.json();
          const matches = (data.similar ?? []).filter(
            (match: SimilarCompany) =>
              !value.id || match.id !== value.id,
          );
          setSimilar(matches);
          if (matches.length === 0) {
            onSimilarityOverrideChange?.(false);
          }
        }
      } catch {
        // ignore aborted requests
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, value.id, onSimilarityOverrideChange]);

  function selectCompany(company: { id: string; name: string }) {
    onChange({ id: company.id, name: company.name });
    setQuery(company.name);
    setOpen(false);
    setSimilar([]);
    onSimilarityOverrideChange?.(false);
  }

  function handleInputChange(next: string) {
    setQuery(next);
    onChange({ name: next });
    setOpen(true);
    onSimilarityOverrideChange?.(false);
  }

  const showSimilarWarning =
    similar.length > 0 && !value.id && !similarOverride && query.trim().length > 0;

  useEffect(() => {
    onSimilarityWarningChange?.(showSimilarWarning);
  }, [showSimilarWarning, onSimilarityWarningChange]);

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
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimeout.current = window.setTimeout(() => setOpen(false), 150);
        }}
        placeholder="Start typing a company name"
        required={required}
        autoComplete="off"
        className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
      />

      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
          {suggestions.map((company) => (
            <li key={company.id}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-emerald-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectCompany(company)}
              >
                {company.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {loading && (
        <p className="mt-1 text-xs text-stone-500">Searching companies…</p>
      )}

      {showSimilarWarning && (
        <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div className="space-y-2 text-sm text-amber-950">
              <p>
                This looks similar to an existing company. Pick the existing
                name to keep the shared list tidy.
              </p>
              <div className="flex flex-wrap gap-2">
                {similar.map((match) => (
                  <Button
                    key={match.id}
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => selectCompany(match)}
                  >
                    Use {match.name}
                  </Button>
                ))}
              </div>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={similarOverride}
                  onChange={(e) =>
                    onSimilarityOverrideChange?.(e.target.checked)
                  }
                  className="mt-0.5"
                />
                <span>
                  Add &quot;{query.trim()}&quot; as a new company anyway
                </span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
