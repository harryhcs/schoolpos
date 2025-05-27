"use client";

import { useState, useTransition } from "react";
import { loginUser, registerUser } from "./functions";

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
      // You might want to redirect or update UI state here
    }
  };

  const handleRegister = async () => {
    const response = await registerUser(username, password);
    
    if (!response.success) {
      setResult(response.error || "Registration failed");
    } else {
      setResult("Registration successful!");
    }
  };

  const handlePerformLogin = () => {
    startTransition(() => void handleLogin());
  };

  const handlePerformRegister = () => {
    startTransition(() => void handleRegister());
  };

  return (
    <div className="flex flex-col gap-4 max-w-sm mx-auto p-4">
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        className="p-2 border rounded"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="p-2 border rounded"
      />
      <div className="flex gap-2">
        <button 
          onClick={handlePerformLogin} 
          disabled={isPending}
          className="flex-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isPending ? "..." : "Login"}
        </button>
        <button 
          onClick={handlePerformRegister} 
          disabled={isPending}
          className="flex-1 p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isPending ? "..." : "Register"}
        </button>
      </div>
      {result && (
        <div className={`p-2 rounded ${
          result.includes("successful") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {result}
        </div>
      )}
    </div>
  );
}
