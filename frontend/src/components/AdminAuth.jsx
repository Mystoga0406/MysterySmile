import React, { useState, useEffect } from "react";

export default function AdminAuth({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    const token = sessionStorage.getItem("admin_token");
    if (token) {
      setAuthenticated(true);
    }
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      if (!data.token) {
        setError("No token received");
        return;
      }

      sessionStorage.setItem("admin_token", data.token);
      setAuthenticated(true);
      setPassword("");
    } catch (err) {
      console.error("Admin login error:", err);
      setError("Network error");
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("admin_token");
    setAuthenticated(false);
    setPassword("");
  }

  if (!authenticated) {
    return (
      <div className="h-screen flex items-center justify-center px-6">
        <div className="bg-black bg-opacity-40 backdrop-blur-xl p-8 rounded-2xl shadow-xl w-full max-w-sm border border-white/20">
          <h2 className="text-3xl font-bold text-center mb-6">
            Admin Login
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 text-black placeholder-gray-300 focus:ring-2 focus:ring-purple-400 outline-none"
              placeholder="Enter Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <p className="text-red-300 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-3 rounded-lg font-bold text-black hover:opacity-90 transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full bg-black/40 text-xs text-right pr-4 py-1 text-gray-200">
        Logged in as Admin{" "}
        <button
          onClick={handleLogout}
          className="underline text-purple-200 ml-2"
        >
          Logout
        </button>
      </div>
      {children}
    </>
  );
}
