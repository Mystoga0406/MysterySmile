/* ========================= src/components/ServiceCard.jsx ========================= */
import React from "react";
import { Link } from "react-router-dom";

export default function ServiceCard({ service }) {
  const categoryLabel =
    service.category?.toUpperCase().trim() === "TAROT"
      ? "Tarot Service"
      : "Spell Service";

  const priceText = (() => {
    const usd = service.priceUsd ? `$${service.priceUsd}` : "";
    const npr = service.priceNpr ? `NPR ${service.priceNpr}` : "";
    const inr = service.priceInr ? `INR ${service.priceInr}` : "";
    let parts = [];

if (usd) parts.push(usd);
if (npr) parts.push(npr);
if (inr) parts.push(inr);

return parts.length > 0 ? parts.join(" / ") : "Price N/A";

  })();

  return (
    <Link
      to={`/booking/${service._id || service.id}`}
      className="
        group
        relative
        flex flex-col
        items-stretch
        justify-between
        rounded-[28px]
        bg-gradient-to-b from-[#6c5aa0] via-[#5a478c] to-[#3c2b63]
        text-white
        px-4 py-5
        shadow-[0_14px_35px_rgba(15,23,42,0.35)]
        border border-white/20
        overflow-hidden
        transition-transform
        hover:scale-[1.03]
        duration-300
        h-[240px] sm:h-[260px]
      "
    >

      {/* Highlight */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent opacity-80 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">

        {/* Category tag */}
        <div className="flex justify-center">
          <span className="
            px-3 py-1
            rounded-full
            bg-white/20
            text-[11px]
            font-medium
            tracking-wide
            backdrop-blur-sm
          ">
            {categoryLabel}
          </span>
        </div>

        {/* Title (NO TRUNCATION) */}
        <h4 className="
          mt-3
          text-center
          text-m
          font-bold
          leading-snug
          px-1
        ">
          {service.name}
        </h4>

        {/* Description — Truncated to 2 lines */}
        <p className="
          mt-2
          text-[11px]
          text-slate-100/90
          text-center
          leading-snug
          px-1
          line-clamp-2
        ">
          {service.description}
        </p>

        <div className="flex-1" />

        {/* Price */}
        <p className="mt-1 text-center text-base font-semibold">
          {priceText}
        </p>

        {/* Book button */}
        <div
          className="
            mt-2
            w-full
            py-2
            rounded-full
            text-center
            text-xs
            font-semibold
            bg-white/20
            border border-white/30
            backdrop-blur-sm
            group-hover:bg-white/30
            transition
          "
        >
          Book
        </div>

      </div>
    </Link>
  );
}
