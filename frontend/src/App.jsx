/* ========================= src/App.jsx ========================= */
import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Booking from "./pages/Booking";
import Admin from "./pages/Admin";
import AdminAuth from "./components/AdminAuth.jsx";



export default function App() {
  return (
    <div className="min-h-screen bg-[#f9f1e3] text-slate-900">

      {/* 🔮 NAVBAR — darker purple + blur + white text */}
      <header className="sticky top-0 z-50 bg-[#3c2960]/80 backdrop-blur-xl border-b border-purple-900/20 shadow-lg">
        <nav className="max-w-6xl mx-auto px-4 md:px-6 py-1 flex justify-between items-center">

          {/* LEFT — Logo + Brand */}
          <Link
  to="/"
  onClick={(e) => {
    if (window.onBookingExitAttempt) {
      e.preventDefault();              // ⛔ stop normal navigation
      window.onBookingExitAttempt();   // 🔥 show exit modal instead
    }
  }}
  className="flex items-center gap-3"
>

            <img
  src={"/assets/logo.jpeg"}       // <- no import, no compile error
  alt="Mystery Smile Logo"
  className="w-14 h-14 rounded-full object-cover border border-white/20 shadow-md"
  onError={(e) => {
    e.target.onerror = null;
    e.target.src = "https://via.placeholder.com/120/3c2960/ffffff?text=MS";
  }}
/>



            <span
              className="text-xl md:text-3xl font-bold text-white drop-shadow-md"
              style={{ fontFamily: "Cinzel, serif" }}
            >
              Mystery Smile
            </span>
          </Link>

          {/* RIGHT — Nav Links */}
          <div className="flex gap-6 items-center">
            <Link
  to="/"
  onClick={(e) => {
    if (window.onBookingExitAttempt) {
      e.preventDefault();              // stop navigation
      window.onBookingExitAttempt();   // show exit modal
    }
  }}
  className="text-sm font-semibold text-white hover:text-purple-200 transition drop-shadow"
  style={{ fontFamily: "Cinzel, serif" }}
>
  Home
</Link>

          </div>

        </nav>
      </header>

      {/* MAIN CONTENT */}
      <main className="py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/booking/:id" element={<Booking />} />
          <Route
            path="/admin"
            element={
              <AdminAuth>
                <Admin />
              </AdminAuth>
            }
          />
        </Routes>
      </main>

      {/* FOOTER — matches navbar */}
      <footer
        className="py-6 text-center text-xs md:text-sm text-white border-t border-purple-900/20"
        style={{
          backgroundColor: "rgba(60, 41, 96, 0.8)",
          fontFamily: "Cinzel, serif",
        }}
      >
        © {new Date().getFullYear()} Mystery Smile — Tarot & Mystical Services
      </footer>

    </div>
  );
}
