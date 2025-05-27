"use client";

import { useState, useTransition } from "react";
import { loginUser } from "./functions";

function Logo() {
  return (
    <div>
      <div className="flex flex-col items-center justify-center mb-4">
        <img src="/images/logo.png" alt="Logo" className="h-50" />
        <div className="text-sm text-gray-500 text-center">Opensource School Tuckshop Point of Sale System</div>
    </div>
    <hr className="w-full border-gray-300" />
    </div>
  );
}

export function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleLogin = async () => {
    const response = await loginUser(username, password);
    
    if (!response.success) {
      setResult(response.error || "Login failed");
    } else {
      setResult("Login successful!");
      window.location.href = "/";
      // You might want to redirect or update UI state here
    }
  };

  const handlePerformLogin = () => {
    startTransition(() => void handleLogin());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <Logo />
        
        <div className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button 
            onClick={handlePerformLogin} 
            disabled={isPending}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Signing in..." : "Sign In"}
          </button>
        </div>

        {result && (
          <div className={`mt-4 p-3 rounded-md ${
            result.includes("successful") 
              ? "bg-green-50 text-green-700 border border-green-200" 
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {result}
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} RedwoodJS. All rights reserved. Built with RedwoodSDK</p>
        </div>
      </div>
    </div>
  );
}
