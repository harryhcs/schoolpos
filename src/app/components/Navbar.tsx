"use client";

import { useState } from "react";
import { logoutUser } from "../pages/user/functions";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const response = await logoutUser();
      if (response.success) {
        window.location.href = '/user/login';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-gray-800 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <a href="/" className="text-xl font-bold">
              <img src="/images/logo.png" alt="Logo" className="h-30" />
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md hover:bg-gray-700 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <a
              href="/user/pos"
              className="px-3 py-2 rounded-md hover:bg-gray-700"
            >
              POS
            </a>
            <a
              href="/user/reports"
              className="px-3 py-2 rounded-md hover:bg-gray-700"
            >
              Reports
            </a>
            <a
              href="/user/settings"
              className="px-3 py-2 rounded-md hover:bg-gray-700"
            >
              Settings
            </a>
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-md bg-red-600 hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a
                href="/user/pos"
                className="block px-3 py-2 rounded-md hover:bg-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                POS
              </a>
              <a
                href="/user/reports"
                className="block px-3 py-2 rounded-md hover:bg-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Reports
              </a>
              <a
                href="/user/settings"
                className="block px-3 py-2 rounded-md hover:bg-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Settings
              </a>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-md bg-red-600 hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 