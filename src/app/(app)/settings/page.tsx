"use client";

import type { ChangeEvent } from "react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const options = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

type ThemePreference = (typeof options)[number]["value"];

export default function SettingsPage() {
  const { data: session } = useSession();
  const serverPreference = session?.user.themePreference ?? "system";
  const [themePreference, setThemePreference] = useState<ThemePreference>(serverPreference);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setThemePreference(serverPreference);
  }, [serverPreference]);

  async function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const selected = event.target.value as ThemePreference;
    setThemePreference(selected);
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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
        <h1 className="text-2xl font-semibold mb-2">Settings</h1>
        <p className="text-zinc-400 mb-6">Change your personal preferences for the app.</p>

        <div className="space-y-6">
          <div>
            <label htmlFor="themePreference" className="block text-sm font-semibold text-zinc-300 mb-2">
              Theme
            </label>
            <select
              id="themePreference"
              value={themePreference}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100"
              disabled={saving}
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-500 mt-2">Stored per account so it follows you across devices.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
