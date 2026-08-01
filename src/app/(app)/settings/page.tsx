"use client";

import type { ChangeEvent } from "react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import DesktopUserMenu from "@/components/DesktopUserMenu";

const options = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

type ThemePreference = (typeof options)[number]["value"];

export default function SettingsPage() {
  const { data: session } = useSession();
  const serverPreference = session?.user.themePreference ?? "system";
  const [pendingThemePreference, setPendingThemePreference] = useState<ThemePreference | null>(null);
  const [saving, setSaving] = useState(false);
  const themePreference = pendingThemePreference ?? serverPreference;

  async function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const selected = event.target.value as ThemePreference;
    setPendingThemePreference(selected);
    setSaving(true);

    await fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themePreference: selected }),
    });

    setSaving(false);
    window.location.reload();
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest">Account Settings</h1>
          <p className="text-dim text-xs uppercase tracking-widest font-light mt-0.5">
            Personal preferences
          </p>
        </div>
        <div className="hidden md:block">
          <DesktopUserMenu />
        </div>
      </div>

      <div className="bg-surface border border-card rounded-3xl p-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="themePreference" className="block text-sm font-semibold text-secondary mb-2">
              Theme
            </label>
            <select
              id="themePreference"
              value={themePreference}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-card border border-subtle rounded-lg text-sm text-content"
              disabled={saving}
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-dim mt-2">Stored per account so it follows you across devices.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
