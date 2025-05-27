"use client";

import { useState, useEffect } from "react";
import { getSettings, updateSetting } from "./functions";
import MainLayout from "@/app/layouts/MainLayout";
import { searchBluetoothPrinters } from "@/app/utils/printer";

interface Setting {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

interface PrinterDevice {
  deviceId: string;
  name: string;
}

export function Settings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [isSearchingPrinters, setIsSearchingPrinters] = useState(false);

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

  const handlePrinterSelect = async (deviceId: string) => {
    setError("");
    setSuccess("");
    
    try {
      const response = await updateSetting('printer_device_id', deviceId);
      if (response.success) {
        setSuccess("Printer selected successfully");
        loadSettings(); // Refresh settings
      } else {
        setError(response.error || "Failed to select printer");
      }
    } catch (error) {
      setError("Failed to select printer");
    }
  };

  const searchPrinters = async () => {
    setIsSearchingPrinters(true);
    setError("");
    try {
      const result = await searchBluetoothPrinters();
      if (result.success && result.devices) {
        setPrinters(result.devices);
      } else {
        setError(result.error || "Failed to search for printers");
      }
    } catch (error) {
      setError("Failed to search for printers. Make sure Bluetooth is enabled.");
    } finally {
      setIsSearchingPrinters(false);
    }
  };

  const getPrinterSetting = () => {
    return settings.find(s => s.key === 'printer_device_id');
  };

  const getCurrentPrinterName = () => {
    const deviceId = getPrinterSetting()?.value;
    if (!deviceId) return '';
    const printer = printers.find(p => p.deviceId === deviceId);
    return printer ? printer.name : 'Unknown Printer';
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
            {/* Printer Settings Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Printer Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Printer
                  </label>
                  {getPrinterSetting()?.value && (
                    <div className="mb-2 p-2 bg-gray-50 rounded border">
                      <span className="text-sm text-gray-600">Current Printer: </span>
                      <span className="font-medium">{getCurrentPrinterName()}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <select
                      value={getPrinterSetting()?.value || ''}
                      onChange={(e) => handlePrinterSelect(e.target.value)}
                      className="flex-1 p-2 border rounded"
                    >
                      <option value="">Select a printer</option>
                      {printers.map((printer) => (
                        <option key={printer.deviceId} value={printer.deviceId}>
                          {printer.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={searchPrinters}
                      disabled={isSearchingPrinters}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      {isSearchingPrinters ? "Searching..." : "Search Printers"}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Click "Search Printers" to find available Bluetooth printers. Make sure your printer is turned on and in pairing mode.
                  </p>
                </div>
              </div>
            </div>

            {/* Other Settings */}
            {settings
              .filter(setting => setting.key !== 'printer_device_id')
              .map((setting) => (
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