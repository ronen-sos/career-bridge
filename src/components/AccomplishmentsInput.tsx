"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { Lightbulb, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/Button";

const GUIDANCE = [
  "Outcomes are the results of your work — higher satisfaction, fewer errors, faster service, more clients served, or improved quality",
  "Start with a strong action verb (Increased, Reduced, Improved, Led, Built…)",
  "Include numbers when you can (%, ratings, headcount, time saved), but qualitative impact counts too",
  "Example: \"Increased customer satisfaction from 7/10 to 9/10 by following up with every client within 24 hours\"",
];

export type AccomplishmentsInputHandle = {
  /** Adds any text still in the input box and returns the full list. */
  commitPending: () => string[];
};

type AccomplishmentsInputProps = {
  value: string[];
  onChange: (items: string[]) => void;
  label?: string;
  placeholder?: string;
};

function splitDraft(text: string): string[] {
  return text
    .split(/\n+/)
    .map((part) => part.replace(/^[-•*]\s*/, "").trim())
    .filter((part) => part.length >= 10);
}

export const AccomplishmentsInput = forwardRef<
  AccomplishmentsInputHandle,
  AccomplishmentsInputProps
>(function AccomplishmentsInput(
  {
    value,
    onChange,
    label = "Key accomplishments",
    placeholder,
  },
  ref,
) {
  const [draft, setDraft] = useState("");
  const pointNumber = value.length + 1;

  const inputPlaceholder =
    placeholder ??
    (value.length === 0
      ? "Type your first point, then press Enter…"
      : `Type point ${pointNumber}, then press Enter…`);

  function commitPending(): string[] {
    const trimmed = draft.trim();
    if (!trimmed) return value;

    const newItems = splitDraft(trimmed);
    if (newItems.length === 0) return value;

    const merged = [...value, ...newItems];
    onChange(merged);
    setDraft("");
    return merged;
  }

  function addItem() {
    commitPending();
  }

  function removeItem(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  useImperativeHandle(ref, () => ({ commitPending }));

  const draftTooShort = draft.trim().length > 0 && draft.trim().length < 10;
  const canAdd = draft.trim().length >= 10;

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-stone-700">
        {label}
      </label>

      <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-start gap-2">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              What changed because of your work?
            </p>
            <ul className="mt-1 space-y-1 text-xs text-amber-800">
              {GUIDANCE.map((tip) => (
                <li key={tip}>• {tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
        <p className="text-sm font-medium text-emerald-900">
          Adding multiple points
        </p>
        <p className="mt-0.5 text-xs text-emerald-800">
          Enter <strong>one accomplishment at a time</strong>. After each point,
          press <kbd className="rounded border border-emerald-300 bg-white px-1 py-0.5 font-mono text-[10px]">Enter</kbd>{" "}
          or tap <strong>Add point</strong> — then type the next one. Anything
          left in the box is included when you save.
        </p>
      </div>

      {value.length > 0 && (
        <ol className="mb-3 space-y-2">
          {value.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800"
            >
              <span className="mt-0.5 shrink-0 font-semibold text-emerald-700">
                {i + 1}.
              </span>
              <span className="flex-1">{item}</span>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="shrink-0 text-stone-400 hover:text-red-600"
                aria-label={`Remove point ${i + 1}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className="space-y-2">
        <p className="text-xs font-medium text-stone-600">
          {value.length === 0 ? "Point 1" : `Point ${pointNumber}`}
        </p>
        <div className="flex gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder={inputPlaceholder}
            className="flex-1 rounded-xl border border-stone-300 px-3 py-3 text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (canAdd) addItem();
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addItem}
            disabled={!canAdd}
            className="shrink-0 self-end"
          >
            <Plus className="h-4 w-4" />
            <span className="ml-1.5">Add point</span>
          </Button>
        </div>
      </div>

      {draftTooShort && (
        <p className="mt-1 text-xs text-stone-500">
          Add a bit more detail for this point (at least 10 characters), then
          press Enter.
        </p>
      )}
      {canAdd && (
        <p className="mt-1 text-xs text-emerald-700">
          Press Enter to add this point and start the next one.
        </p>
      )}
    </div>
  );
});
