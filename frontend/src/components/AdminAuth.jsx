import React, { useState } from "react";

export default function AdminAuth({ children }) {
  const [authenticated, setAuthenticated] = useState(
    sessionStorage.getItem("admin_auth") === "true"
  );
  const [password, setPassword] = useState("");

  function handleLogin(e) {
    e.preventDefault();
    if (password === "admin123") {
      sessionStorage.setItem("admin_auth", "true");
      setAuthenticated(true);
    } else {
      alert("Wrong password");
    }
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
              className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 text-white placeholder-gray-300 focus:ring-2 focus:ring-purple-400 outline-none"
              placeholder="Enter Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

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

  return children;
}
