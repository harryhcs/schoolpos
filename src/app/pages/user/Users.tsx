"use client";

import { useState, useTransition, useEffect } from "react";
import { getUsers, createUser, updateUser } from "./functions";

interface User {
  id: string;
  username: string;
  email?: string;
  role: "ADMIN" | "MANAGER" | "WORKER";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    role: "WORKER" as const,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const response = await getUsers();
    if (response.success) {
      setUsers(response.users);
    } else {
      setError(response.error || "Failed to load users");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (editingUser) {
      const response = await updateUser(editingUser.id, {
        email: formData.email || undefined,
        role: formData.role,
        password: formData.password || undefined,
      });

      if (response.success) {
        setSuccess("User updated successfully");
        setEditingUser(null);
        loadUsers();
      } else {
        setError(response.error || "Failed to update user");
      }
    } else {
      const response = await createUser(
        formData.username,
        formData.password,
        formData.role,
        formData.email || undefined
      );

      if (response.success) {
        setSuccess("User created successfully");
        loadUsers();
      } else {
        setError(response.error || "Failed to create user");
      }
    }

    setFormData({
      username: "",
      password: "",
      email: "",
      role: "WORKER",
    });
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: "",
      email: user.email || "",
      role: user.role,
    });
  };

  const handleToggleActive = async (user: User) => {
    const response = await updateUser(user.id, {
      isActive: !user.isActive,
    });

    if (response.success) {
      loadUsers();
    } else {
      setError(response.error || "Failed to update user status");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>

      <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">
          {editingUser ? "Edit User" : "Add New User"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
              disabled={!!editingUser}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full p-2 border rounded"
              required={!editingUser}
              placeholder={editingUser ? "Leave blank to keep current" : ""}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as "ADMIN" | "MANAGER" | "WORKER",
                })
              }
              className="w-full p-2 border rounded"
            >
              <option value="WORKER">Worker</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={isPending}
          >
            {editingUser ? "Update User" : "Add User"}
          </button>
          {editingUser && (
            <button
              type="button"
              onClick={() => {
                setEditingUser(null);
                setFormData({
                  username: "",
                  password: "",
                  email: "",
                  role: "WORKER",
                });
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left">Username</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-center">Status</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="px-4 py-2">{user.username}</td>
                <td className="px-4 py-2">{user.email || "-"}</td>
                <td className="px-4 py-2">{user.role}</td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => handleToggleActive(user)}
                    className={`px-2 py-1 rounded ${
                      user.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => handleEdit(user)}
                    className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 