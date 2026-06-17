"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/Button";

export type AskManagerConfig = {
  managerName: string;
};

type AskManagerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: AskManagerConfig;
};

export function AskManagerDialog({
  open,
  onOpenChange,
  config,
}: AskManagerDialogProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;

    dialog.showModal();
    setError(null);
    setSuccess(null);

    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  function handleClose() {
    if (loading) return;
    onOpenChange(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setLoading(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(formEl);
    const question = String(form.get("question") ?? "").trim();

    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (typeof data.error === "string") {
        setError(data.error);
      } else if (data.error?.question?.[0]) {
        setError(data.error.question[0]);
      } else {
        setError("Could not send your question.");
      }
      setLoading(false);
      return;
    }

    const data = await res.json();
    formEl.reset();
    setSuccess(
      data.emailSent
        ? `Your question was sent to ${config.managerName}.`
        : `Your question was saved. Email could not be sent — your manager will still see it when they log in.`,
    );
    setLoading(false);
    router.refresh();
  }

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className="fixed inset-0 z-50 m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-4 backdrop:bg-stone-900/50 open:flex open:items-end open:justify-center sm:open:items-center"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">
              Ask your program manager
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Send a question to {config.managerName}. Ask whenever you need
              help — there&apos;s no daily requirement.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="participantQuestion"
              className="mb-1 block text-sm font-medium text-stone-700"
            >
              Your question
            </label>
            <textarea
              id="participantQuestion"
              name="question"
              required
              rows={4}
              placeholder="What would you like to ask?"
              className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-emerald-800">{success}</p>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              disabled={loading}
              onClick={handleClose}
            >
              {success ? "Close" : "Cancel"}
            </Button>
            <Button type="submit" disabled={loading || !!success}>
              {loading ? "Sending…" : "Send question"}
            </Button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
