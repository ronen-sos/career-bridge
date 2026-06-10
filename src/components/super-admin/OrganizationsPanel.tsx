"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";

type OrgAdmin = {
  id: string;
  name: string;
  email: string;
  invitedAt: string | null;
};

type Organization = {
  id: string;
  name: string;
  hasLogo: boolean;
  logoUpdatedAt: string;
  createdAt: string;
  userCount: number;
  admins: OrgAdmin[];
};

export function OrganizationsPanel() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function loadOrganizations() {
    setError(null);
    const res = await fetch("/api/super-admin/organizations");
    if (!res.ok) {
      setError("Could not load organizations.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setOrganizations(data.organizations ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadOrganizations();
  }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    setCreating(true);
    setCreateError(null);

    const res = await fetch("/api/super-admin/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name") }),
    });

    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      setCreateError(
        typeof data.error === "string"
          ? data.error
          : "Could not create the organization.",
      );
      return;
    }

    formElement.reset();
    await loadOrganizations();
  }

  if (loading) {
    return (
      <p className="py-8 text-center text-stone-500">Loading organizations…</p>
    );
  }

  if (error) {
    return <p className="py-8 text-center text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>New organization</CardTitle>
        <CardDescription>
          Create the organization first, then upload its logo and invite its
          admin below.
        </CardDescription>
        <form
          onSubmit={handleCreate}
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <input
            name="name"
            required
            maxLength={120}
            placeholder="Organization name"
            className="flex-1 rounded-xl border border-stone-300 px-3 py-3 text-base"
          />
          <Button type="submit" disabled={creating}>
            {creating ? "Creating…" : "Create organization"}
          </Button>
        </form>
        {createError && (
          <p className="mt-2 text-sm text-red-600">{createError}</p>
        )}
      </Card>

      {organizations.length === 0 ? (
        <p className="py-4 text-center text-stone-500">
          No organizations yet.
        </p>
      ) : (
        organizations.map((org) => (
          <OrganizationCard
            key={org.id}
            organization={org}
            onChanged={loadOrganizations}
          />
        ))
      )}
    </div>
  );
}

function OrganizationCard({
  organization,
  onChanged,
}: {
  organization: Organization;
  onChanged: () => Promise<void>;
}) {
  const [name, setName] = useState(organization.name);
  const [savingName, setSavingName] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function showError(data: unknown, fallback: string) {
    const err = (data as { error?: unknown })?.error;
    setCardError(typeof err === "string" ? err : fallback);
    setMessage(null);
  }

  function showMessage(text: string) {
    setMessage(text);
    setCardError(null);
  }

  async function saveName() {
    if (!name.trim() || name.trim() === organization.name) return;
    setSavingName(true);
    const res = await fetch(`/api/super-admin/organizations/${organization.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSavingName(false);
    if (!res.ok) {
      showError(await res.json(), "Could not rename the organization.");
      return;
    }
    showMessage("Organization renamed.");
    await onChanged();
  }

  async function uploadLogo(file: File) {
    setUploadingLogo(true);
    setCardError(null);
    const formData = new FormData();
    formData.append("logo", file);

    const res = await fetch(
      `/api/super-admin/organizations/${organization.id}/logo`,
      { method: "POST", body: formData },
    );
    setUploadingLogo(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!res.ok) {
      showError(await res.json(), "Could not upload the logo.");
      return;
    }
    showMessage("Logo updated.");
    await onChanged();
  }

  async function removeLogo() {
    const res = await fetch(
      `/api/super-admin/organizations/${organization.id}/logo`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      showError(await res.json(), "Could not remove the logo.");
      return;
    }
    showMessage("Logo removed.");
    await onChanged();
  }

  async function deleteOrganization() {
    if (
      !confirm(
        `Delete ${organization.name}? This only works when it has no users.`,
      )
    ) {
      return;
    }
    const res = await fetch(`/api/super-admin/organizations/${organization.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      showError(await res.json(), "Could not delete the organization.");
      return;
    }
    await onChanged();
  }

  async function handleAddAdmin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    setAddingAdmin(true);
    setCardError(null);

    try {
      const res = await fetch(
        `/api/super-admin/organizations/${organization.id}/admins`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.get("name"),
            email: form.get("email"),
            sendInvite: true,
            personalNote:
              (form.get("personalNote") as string).trim() || undefined,
          }),
          signal: AbortSignal.timeout(30_000),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        showError(data, "Could not invite the admin.");
        return;
      }

      formElement.reset();
      showMessage(
        data.emailSent
          ? `Invitation sent to ${data.user.email}.`
          : `${data.user.name} was added, but the invite email could not be sent: ${data.emailError ?? "unknown error"}.`,
      );
      await onChanged();
    } catch {
      setCardError("Request timed out while sending the invitation.");
    } finally {
      setAddingAdmin(false);
    }
  }

  const logoUrl = `/api/organizations/${organization.id}/logo?v=${encodeURIComponent(organization.logoUpdatedAt)}`;

  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          {organization.hasLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={`${organization.name} logo`}
              className="h-12 w-12 rounded-xl border border-stone-200 bg-white object-contain p-1"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-stone-300 text-xs text-stone-400">
              Logo
            </div>
          )}
          <div>
            <CardTitle>{organization.name}</CardTitle>
            <CardDescription>
              {organization.userCount}{" "}
              {organization.userCount === 1 ? "user" : "users"}
            </CardDescription>
          </div>
        </div>

        {organization.userCount === 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={deleteOrganization}
            className="self-start text-red-700"
          >
            Delete
          </Button>
        )}
      </div>

      {message && (
        <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {message}
        </p>
      )}
      {cardError && <p className="mt-3 text-sm text-red-600">{cardError}</p>}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Name
            </label>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                className="flex-1 rounded-xl border border-stone-300 px-3 py-2 text-sm"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={savingName || name.trim() === organization.name}
                onClick={saveName}
              >
                {savingName ? "Saving…" : "Rename"}
              </Button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Logo{" "}
              <span className="font-normal text-stone-500">
                (PNG, JPEG, SVG, or WebP — up to 1 MB)
              </span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                disabled={uploadingLogo}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadLogo(file);
                }}
                className="text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-stone-700"
              />
              {uploadingLogo && (
                <span className="text-sm text-stone-500">Uploading…</span>
              )}
              {organization.hasLogo && !uploadingLogo && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeLogo}
                  className="text-red-700"
                >
                  Remove logo
                </Button>
              )}
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-stone-700">
            Admins ({organization.admins.length})
          </p>
          {organization.admins.length > 0 && (
            <ul className="mt-2 space-y-1">
              {organization.admins.map((admin) => (
                <li key={admin.id} className="text-sm text-stone-600">
                  {admin.name}{" "}
                  <span className="text-stone-400">({admin.email})</span>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleAddAdmin} className="mt-3 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                name="name"
                required
                placeholder="Admin name"
                className="rounded-xl border border-stone-300 px-3 py-2 text-sm"
              />
              <input
                name="email"
                type="email"
                required
                placeholder="admin@example.org"
                className="rounded-xl border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <textarea
              name="personalNote"
              rows={2}
              maxLength={500}
              placeholder="Personal note for the invite email (optional)"
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
            />
            <Button type="submit" size="sm" disabled={addingAdmin}>
              {addingAdmin ? "Sending invitation…" : "Invite admin"}
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
}
