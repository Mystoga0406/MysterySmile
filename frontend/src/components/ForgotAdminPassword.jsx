import { useState } from "react";
import { sendAdminOtp, resetAdminPassword } from "../api";

export default function ForgotAdminPassword({ onBack }) {
  const [step, setStep] = useState(1); // 1 = send otp, 2 = reset
  const [email] = useState("vibeknpn@gmail.com");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  async function handleSendOtp(e) {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      await sendAdminOtp(email);
      setMsg("OTP sent to admin email");
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
  e.preventDefault();
  setError("");

  if (newPassword !== confirm) {
    setError("Passwords do not match");
    return;
  }

  try {
    setLoading(true);
    await resetAdminPassword(otp.trim(), newPassword);
    setMsg("Password reset successful");
    setTimeout(onBack, 1500);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}


  return (
    <div className="bg-black/70 p-6 rounded-xl border border-purple-400 w-full max-w-sm text-white">
      <h2 className="text-xl font-bold mb-4 text-center">
        Forgot Admin Password
      </h2>

      {error && (
        <div className="text-red-400 text-sm mb-2">{error}</div>
      )}
      {msg && (
        <div className="text-green-400 text-sm mb-2">{msg}</div>
      )}

      {step === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <p className="text-sm text-purple-200">
            OTP will be sent to admin email.
          </p>

          <button
            className="w-full bg-purple-600 py-2 rounded-lg font-semibold"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full text-xs underline text-purple-300"
          >
            Back to login
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleReset} className="space-y-3">
          <input
  type="text"
  inputMode="numeric"
  autoComplete="one-time-code"
  placeholder="Enter OTP"
  value={otp}
  onChange={(e) => setOtp(e.target.value)}
  className="w-full p-2 rounded bg-black border border-purple-400"
/>


          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-2 rounded bg-black border border-purple-400"
          />

          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full p-2 rounded bg-black border border-purple-400"
          />

          <button
            className="w-full bg-green-600 py-2 rounded-lg font-semibold"
            disabled={loading}
          >
            {loading ? "Saving..." : "Reset Password"}
          </button>
        </form>
      )}
    </div>
  );
}
