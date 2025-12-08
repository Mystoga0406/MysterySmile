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
  className="border-t border-purple-900/20"
  style={{
    backgroundColor: "rgba(60, 41, 96, 0.8)",
    fontFamily: "Cinzel, serif",
  }}
>
  <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4 text-white">

    {/* LEFT — Copyright */}
    <div className="text-center md:text-left text-xs md:text-sm">
      © {new Date().getFullYear()} Mystery Smile — Tarot & Mystical Services
    </div>

    {/* RIGHT — Contact Us */}
    <div className="flex flex-col items-center md:items-end gap-2">
      <span className="text-sm font-semibold tracking-wide">
        Contact Us
      </span>

      <div className="flex gap-5 text-sm">

        {/* INSTAGRAM */}
        <a
          href="https://www.instagram.com/mystery__smile?igsh=OGgyOHd4cGhtc3hl"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:opacity-80 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="w-5 h-5"
            fill="url(#igGradient)"
          >
            <defs>
              <linearGradient id="igGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f58529" />
                <stop offset="30%" stopColor="#dd2a7b" />
                <stop offset="60%" stopColor="#8134af" />
                <stop offset="100%" stopColor="#515bd4" />
              </linearGradient>
            </defs>
            <path d="M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm0 1.5A4.25 4.25 0 003.5 7.75v8.5A4.25 4.25 0 007.75 20.5h8.5a4.25 4.25 0 004.25-4.25v-8.5A4.25 4.25 0 0016.25 3.5h-8.5zM12 7a5 5 0 110 10 5 5 0 010-10zm0 1.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm5.25-.88a1.13 1.13 0 11-2.26 0 1.13 1.13 0 012.26 0z" />
          </svg>
          <span>Instagram</span>
        </a>

        {/* WHATSAPP */}
        <a
          href="https://wa.me/+9779869210540"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:opacity-80 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            className="w-5 h-5"
            fill="#25D366"
          >
            <path d="M19.11 17.53c-.27-.13-1.6-.8-1.85-.89-.25-.09-.43-.13-.61.13s-.7.89-.86 1.07c-.16.18-.32.2-.59.07-.27-.13-1.14-.42-2.18-1.33-.81-.72-1.36-1.6-1.52-1.87-.16-.27-.02-.42.12-.55.13-.13.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.04-.34-.02-.48-.07-.13-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47h-.52c-.18 0-.47.07-.72.34-.25.27-.95.93-.95 2.27 0 1.34.98 2.63 1.11 2.81.13.18 1.93 2.95 4.68 4.13.65.28 1.15.45 1.54.57.65.21 1.24.18 1.71.11.52-.08 1.6-.65 1.83-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32z" />
            <path d="M16 3C8.83 3 3 8.83 3 16c0 2.82.75 5.47 2.07 7.77L3 29l5.34-2.02A12.88 12.88 0 0016 29c7.17 0 13-5.83 13-13S23.17 3 16 3zm0 23.5c-2.32 0-4.48-.68-6.3-1.85l-.45-.28-3.16 1.2 1.2-3.07-.29-.47A10.42 10.42 0 015.5 16C5.5 10.21 10.21 5.5 16 5.5S26.5 10.21 26.5 16 21.79 26.5 16 26.5z" />
          </svg>
          <span>WhatsApp</span>
        </a>

      </div>
    </div>
  </div>
</footer>


    </div>
  );
}
