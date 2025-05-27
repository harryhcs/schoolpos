"use client";

import { useState, useEffect } from "react";
import { getSettings, updateSetting } from "./functions";
import MainLayout from "@/app/layouts/MainLayout";

interface Setting {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

export function Settings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await getSettings();
      if (response.success && response.settings) {
        setSettings(response.settings);
      } else {
        setError(response.error || "Failed to load settings");
      }
    } catch (error) {
      setError("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    setError("");
    setSuccess("");

    try {
      const response = await updateSetting(key, value);
      if (response.success) {
        setSuccess("Setting updated successfully");
        loadSettings(); // Refresh settings
      } else {
        setError(response.error || "Failed to update setting");
      }
    } catch (error) {
      setError("Failed to update setting");
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        {isLoading ? (
          <div className="text-center py-4">Loading settings...</div>
        ) : error ? (
          <div className="p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            {settings.map((setting) => (
              <div key={setting.id} className="bg-white p-4 rounded-lg shadow">
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {setting.key}
                  </label>
                  {setting.description && (
                    <p className="text-sm text-gray-500">{setting.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={setting.value}
                    onChange={(e) => {
                      const newSettings = settings.map(s =>
                        s.id === setting.id ? { ...s, value: e.target.value } : s
                      );
                      setSettings(newSettings);
                    }}
                    className="flex-1 p-2 border rounded"
                  />
                  <button
                    onClick={() => handleUpdateSetting(setting.key, setting.value)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">
            {success}
          </div>
        )}
      </div>
    </MainLayout>
  );
} 