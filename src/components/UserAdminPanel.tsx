"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";

type User = {
  id: string;
  email: string;
  name: string;
  role: "PARTICIPANT" | "MANAGER" | "ADMIN";
  managerId: string | null;
  manager: { id: string; name: string; email: string } | null;
};

const ROLE_LABELS: Record<User["role"], string> = {
  PARTICIPANT: "Participant",
  MANAGER: "Manager",
  ADMIN: "Admin",
};

const ROLE_COLORS: Record<User["role"], string> = {
  PARTICIPANT: "bg-blue-100 text-blue-800",
  MANAGER: "bg-emerald-100 text-emerald-800",
  ADMIN: "bg-purple-100 text-purple-800",
};

export function UserAdminPanel() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const managers = users.filter((u) => u.role === "MANAGER" || u.role === "ADMIN");

  async function loadUsers() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/users");
    if (!res.ok) {
      setError("Could not load users.");
      setLoading(false);
      return;
    }
    setUsers(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const form = new FormData(e.currentTarget);
    const role = form.get("role") as User["role"];
    const managerId = form.get("managerId") as string;

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        name: form.get("name"),
        role,
        managerId: role === "PARTICIPANT" && managerId ? managerId : null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setFormError(typeof data.error === "string" ? data.error : "Could not create user.");
      setSaving(false);
      return;
    }

    e.currentTarget.reset();
    await loadUsers();
    router.refresh();
    setSaving(false);
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

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Remove ${name} from Career Bridge?`)) return;

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
        <CardTitle>Add user</CardTitle>
        <CardDescription>
          Register a Google email so they can sign in. They must use that exact
          address with Google.
        </CardDescription>

        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" name="name" required placeholder="John Smith" />
            <Field
              label="Google email"
              name="email"
              type="email"
              required
              placeholder="name@thriveinmn.com"
            />
          </div>

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

          {managers.length > 0 && (
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
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? "Adding…" : "Add user"}
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
                  {user.manager && (
                    <p className="mt-1 text-xs text-stone-500">
                      Manager: {user.manager.name}
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

                {user.role === "PARTICIPANT" && managers.length > 0 && (
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
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteUser(user.id, user.name)}
                  className="text-red-700"
                >
                  Remove
                </Button>
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
