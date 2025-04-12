"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, UserCheck, Search } from "lucide-react";

type User = {
  id: number;
  email: string;
  username: string;
  role: string;
};

const AdminPanel = () => {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const makeAdmin = async (userId: number) => {
    if (!confirm("Are you sure you want to make this user an admin?")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/make-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update user role");
      }

      // Refresh users list
      await fetchUsers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.username.toLowerCase().includes(searchLower)
    );
  });

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bg-red-900/50 text-white p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p>You do not have permission to access the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-800/40 border-white border-solid border-[1px] text-white p-10 rounded-2xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

      {error && (
        <div className="bg-red-900 text-white p-4 rounded-xl mb-6">
          <p>{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 bg-red-700 hover:bg-red-800 text-white py-1 px-3 rounded-xl text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">User Management</h2>
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-neutral-700 border border-neutral-600 pl-10 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-neutral-700">
                <th className="p-3 text-left">Username</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center">
                    <Loader2 className="animate-spin mx-auto" size={24} />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-neutral-700 hover:bg-neutral-700/50"
                  >
                    <td className="p-3">{user.username}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          user.role === "ADMIN"
                            ? "bg-green-900/60 text-green-300"
                            : "bg-blue-900/60 text-blue-300"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3">
                      {user.role !== "ADMIN" && (
                        <button
                          onClick={() => makeAdmin(user.id)}
                          className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-lg text-sm"
                        >
                          <UserCheck className="h-3 w-3" /> Make Admin
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
