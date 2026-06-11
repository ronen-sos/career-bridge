"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";

type User = {
  id: string;
  email: string;
  name: string;
  role: "PARTICIPANT" | "MANAGER" | "ADMIN" | "SUPER_ADMIN";
  managerId: string | null;
  invitedAt: string | null;
  lastLoginAt: string | null;
  manager: { id: string; name: string; email: string } | null;
  organization: { id: string; name: string } | null;
};

const ROLE_LABELS: Record<User["role"], string> = {
  PARTICIPANT: "Participant",
  MANAGER: "Manager",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

const ROLE_COLORS: Record<User["role"], string> = {
  PARTICIPANT: "bg-blue-100 text-blue-800",
  MANAGER: "bg-emerald-100 text-emerald-800",
  ADMIN: "bg-purple-100 text-purple-800",
  SUPER_ADMIN: "bg-stone-900 text-white",
};

function formatTimestamp(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/**
 * Server renders in its own timezone, the visitor's browser in theirs.
 * Suppress the hydration mismatch, then re-render once after mount so the
 * visitor always sees their local time.
 */
function LocalTimestamp({ value }: { value: string }) {
  const [, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <span suppressHydrationWarning>{formatTimestamp(value)}</span>;
}

export type UserAdminInitialData = {
  users: User[];
  organizations: Array<{ id: string; name: string }>;
  viewerIsSuperAdmin: boolean;
  viewerOrganizationId: string | null;
  emailConfigured: boolean;
  emailProvider: "resend" | "gmail" | null;
};

export function UserAdminPanel({
  initialData,
}: {
  initialData?: UserAdminInitialData;
}) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialData?.users ?? []);
  const [organizations, setOrganizations] = useState<
    Array<{ id: string; name: string }>
  >(initialData?.organizations ?? []);
  const [isSuperAdminViewer, setIsSuperAdminViewer] = useState(
    initialData?.viewerIsSuperAdmin ?? false,
  );
  const [inviteOrgId, setInviteOrgId] = useState<string>(
    initialData?.viewerOrganizationId ?? "",
  );
  const [emailConfigured, setEmailConfigured] = useState(
    initialData?.emailConfigured ?? true,
  );
  const [emailProvider, setEmailProvider] = useState<"resend" | "gmail" | null>(
    initialData?.emailProvider ?? null,
  );
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  const allManagers = users.filter(
    (u) => u.role === "MANAGER" || u.role === "ADMIN" || u.role === "SUPER_ADMIN",
  );

  // Participants can only be assigned managers from the same organization.
  const inviteManagers = isSuperAdminViewer
    ? allManagers.filter((m) => m.organization?.id === inviteOrgId)
    : allManagers;

  function managersForUser(user: User) {
    if (!isSuperAdminViewer) return allManagers;
    return allManagers.filter(
      (m) => m.organization?.id === user.organization?.id,
    );
  }

  async function loadUsers() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/users");
    if (!res.ok) {
      setError("Could not load users.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setUsers(data.users ?? data);
    setOrganizations(data.organizations ?? []);
    setIsSuperAdminViewer(data.viewerIsSuperAdmin ?? false);
    setInviteOrgId(
      (current) => current || data.viewerOrganizationId || "",
    );
    setEmailConfigured(data.emailConfigured ?? true);
    setEmailProvider(data.emailProvider ?? null);
    setLoading(false);
  }

  useEffect(() => {
    // Server-rendered data arrives via props; only fetch when it's absent.
    if (!initialData) loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formElement = e.currentTarget;
    setSaving(true);
    setFormError(null);
    setFormSuccess(null);

    const form = new FormData(formElement);
    const role = form.get("role") as User["role"];
    const managerId = form.get("managerId") as string;
    const personalNote = (form.get("personalNote") as string).trim();

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          name: form.get("name"),
          role,
          managerId: role === "PARTICIPANT" && managerId ? managerId : null,
          organizationId: isSuperAdminViewer ? inviteOrgId || null : null,
          sendInvite: true,
          personalNote: personalNote || undefined,
        }),
        signal: AbortSignal.timeout(30_000),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(
          typeof data.error === "string"
            ? data.error
            : "Could not send invitation.",
        );
        return;
      }

      formElement.reset();

      if (data.emailSent) {
        setFormSuccess(`Invitation email sent to ${data.user.email}.`);
      } else {
        setFormSuccess(
          `${data.user.name} was added, but the invite email could not be sent: ${data.emailError ?? "unknown error"}.`,
        );
      }

      await loadUsers();
      router.refresh();
    } catch {
      setFormError("Request timed out. On Railway, use Resend (RESEND_API_KEY) instead of Gmail SMTP.");
    } finally {
      setSaving(false);
    }
  }

  async function resendInvite(user: User) {
    setResendingId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(30_000),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(typeof data.error === "string" ? data.error : "Could not resend invite.");
        return;
      }

      await loadUsers();
      alert(`Invitation resent to ${user.email}.`);
    } catch {
      alert("Request timed out. On Railway, use Resend (RESEND_API_KEY) instead of Gmail SMTP.");
    } finally {
      setResendingId(null);
    }
  }

  async function updateUser(
    id: string,
    data: { role?: User["role"]; managerId?: string | null },
  ) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const result = await res.json();
      alert(typeof result.error === "string" ? result.error : "Update failed.");
      return;
    }

    await loadUsers();
    router.refresh();
  }

  async function viewAsUser(user: User) {
    setImpersonatingId(user.id);
    const res = await fetch("/api/super-admin/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(
        typeof data.error === "string"
          ? data.error
          : "Could not start viewing as this user.",
      );
      setImpersonatingId(null);
      return;
    }

    window.location.href = "/dashboard";
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Remove ${name} from Career Path?`)) return;

    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const result = await res.json();
      alert(typeof result.error === "string" ? result.error : "Delete failed.");
      return;
    }

    await loadUsers();
    router.refresh();
  }

  if (loading) {
    return <p className="py-8 text-center text-stone-500">Loading users…</p>;
  }

  if (error) {
    return <p className="py-8 text-center text-red-600">{error}</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <Card>
        <CardTitle>Invite someone</CardTitle>
        <CardDescription>
          Send a welcome email with a link to sign in. They must use the same
          Google account as the email address you enter.
        </CardDescription>

        {!emailConfigured && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-medium">Email not configured</p>
            <p className="mt-1">
              For <strong>production (Railway)</strong>, add{" "}
              <code className="rounded bg-amber-100 px-1">RESEND_API_KEY</code> and{" "}
              <code className="rounded bg-amber-100 px-1">EMAIL_FROM</code> — Gmail
              SMTP is blocked on Railway and will time out.
            </p>
            <p className="mt-2">
              For <strong>local dev</strong>, use{" "}
              <code className="rounded bg-amber-100 px-1">GMAIL_USER</code> and{" "}
              <code className="rounded bg-amber-100 px-1">GMAIL_APP_PASSWORD</code>.
            </p>
          </div>
        )}

        {emailConfigured && emailProvider === "gmail" && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-medium">Using Gmail SMTP</p>
            <p className="mt-1">
              This works locally but often times out on Railway. Add{" "}
              <code className="rounded bg-amber-100 px-1">RESEND_API_KEY</code> on
              Railway for reliable production invites.
            </p>
          </div>
        )}

        <form onSubmit={handleInvite} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" name="name" required placeholder="John Smith" />
            <Field
              label="Email address"
              name="email"
              type="email"
              required
              placeholder="name@thriveinmn.com"
            />
          </div>

          {isSuperAdminViewer && organizations.length > 0 && (
            <div>
              <label
                htmlFor="inviteOrganizationId"
                className="mb-1 block text-sm font-medium text-stone-700"
              >
                Organization
              </label>
              <select
                id="inviteOrganizationId"
                required
                value={inviteOrgId}
                onChange={(e) => setInviteOrgId(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="role" className="mb-1 block text-sm font-medium text-stone-700">
              Role
            </label>
            <select
              id="role"
              name="role"
              required
              defaultValue="PARTICIPANT"
              className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
            >
              <option value="PARTICIPANT">Participant</option>
              <option value="MANAGER">Program Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {inviteManagers.length > 0 && (
            <div>
              <label htmlFor="managerId" className="mb-1 block text-sm font-medium text-stone-700">
                Assigned manager (participants only)
              </label>
              <select
                id="managerId"
                name="managerId"
                className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
                defaultValue=""
              >
                <option value="">None</option>
                {inviteManagers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="personalNote" className="mb-1 block text-sm font-medium text-stone-700">
              Personal note <span className="font-normal text-stone-500">(optional)</span>
            </label>
            <textarea
              id="personalNote"
              name="personalNote"
              rows={3}
              maxLength={500}
              placeholder="Add a warm welcome — this appears in the invitation email."
              className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
            />
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}
          {formSuccess && (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {formSuccess}
            </p>
          )}

          <Button
            type="submit"
            disabled={saving || !emailConfigured}
            className="w-full sm:w-auto"
          >
            {saving ? "Sending invitation…" : "Send invitation"}
          </Button>
        </form>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-stone-900">
          All users ({users.length})
        </h2>
        <ul className="space-y-3">
          {users.map((user) => (
            <li
              key={user.id}
              className="rounded-2xl border border-stone-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-stone-900">{user.name}</p>
                  <p className="text-sm text-stone-600">{user.email}</p>
                  {isSuperAdminViewer && user.organization && (
                    <p className="mt-1 text-xs font-medium text-emerald-800">
                      {user.organization.name}
                    </p>
                  )}
                  {user.manager && (
                    <p className="mt-1 text-xs text-stone-500">
                      Manager: {user.manager.name}
                    </p>
                  )}
                  {user.invitedAt ? (
                    <p className="mt-1 text-xs text-emerald-700">
                      Invited <LocalTimestamp value={user.invitedAt} />
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-stone-500">Not invited yet</p>
                  )}
                  {user.lastLoginAt ? (
                    <p className="mt-0.5 text-xs text-stone-500">
                      Last sign-in: <LocalTimestamp value={user.lastLoginAt} />
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-stone-400">
                      Never signed in
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role]}`}
                >
                  {ROLE_LABELS[user.role]}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {user.role !== "SUPER_ADMIN" && (
                  <select
                    value={user.role}
                    onChange={(e) =>
                      updateUser(user.id, {
                        role: e.target.value as User["role"],
                        managerId: e.target.value === "PARTICIPANT" ? user.managerId : null,
                      })
                    }
                    className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
                  >
                    <option value="PARTICIPANT">Participant</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                )}

                {user.role === "PARTICIPANT" && managersForUser(user).length > 0 && (
                  <select
                    value={user.managerId ?? ""}
                    onChange={(e) =>
                      updateUser(user.id, {
                        managerId: e.target.value || null,
                      })
                    }
                    className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
                  >
                    <option value="">No manager</option>
                    {managersForUser(user).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                )}

                {isSuperAdminViewer && user.role !== "SUPER_ADMIN" && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={impersonatingId !== null}
                    onClick={() => viewAsUser(user)}
                  >
                    {impersonatingId === user.id ? "Switching…" : "View as"}
                  </Button>
                )}

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!emailConfigured || resendingId === user.id}
                  onClick={() => resendInvite(user)}
                >
                  {resendingId === user.id ? "Sending…" : "Resend invite"}
                </Button>

                {user.role !== "SUPER_ADMIN" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteUser(user.id, user.name)}
                    className="text-red-700"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-stone-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
      />
    </div>
  );
}
