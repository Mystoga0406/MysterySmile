import React, { useState } from "react";

export default function ChangeAdminPassword({ onClose }) {
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  /* ================= SEND OTP ================= */
  async function handleSendOtp() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const res = await fetch(
        `${API_BASE_URL}/api/admin/forgot-password`,
        { method: "POST" }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send OTP");
        return;
      }

      setOtpSent(true);
      setMessage("✅ OTP sent to admin email");

    } catch (err) {
      console.error(err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  /* ================= SUBMIT CHANGE ================= */
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!otp) {
      setError("OTP is required");
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      setLoading(true);

      const token = sessionStorage.getItem("admin_token");

      const res = await fetch(
        `${API_BASE_URL}/api/admin/change-password-secure`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            otp,
            currentPassword,
            newPassword,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to change password");
        return;
      }

      setMessage("✅ Password changed successfully. Please login again.");

      setTimeout(() => {
        sessionStorage.removeItem("admin_token");
        window.location.reload();
      }, 1500);

    } catch (err) {
      console.error(err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/20 shadow-xl">

      <h3 className="text-xl font-bold mb-4 text-center">
        Change Admin Password
      </h3>

      {/* MESSAGE */}
      {error && <p className="text-red-300 text-sm text-center mb-2">{error}</p>}
      {message && <p className="text-green-300 text-sm text-center mb-2">{message}</p>}

      {/* SEND OTP */}
      {!otpSent && (
        <button
          onClick={handleSendOtp}
          disabled={loading}
          className="w-full py-3 rounded-lg font-bold bg-purple-600 hover:bg-purple-700 mb-4"
        >
          {loading ? "Sending OTP..." : "Send OTP to Email"}
        </button>
      )}

      {/* FORM AFTER OTP */}
      {otpSent && (
        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            placeholder="Enter OTP"
            className="w-full px-4 py-3 rounded-lg bg-white/20 text-white outline-none"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />

          <input
            type="password"
            placeholder="Current Password"
            className="w-full px-4 py-3 rounded-lg bg-white/20 text-white outline-none"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="New Password"
            className="w-full px-4 py-3 rounded-lg bg-white/20 text-white outline-none"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            className="w-full px-4 py-3 rounded-lg bg-white/20 text-white outline-none"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-black"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      )}
    </div>
  );
}