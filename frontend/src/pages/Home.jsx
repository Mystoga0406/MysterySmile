/* ========================= src/pages/Home.jsx ========================= */
import React, { useEffect, useState } from "react";
import ServiceCard from "../components/ServiceCard";
import { fetchServices } from "../api";

export default function Home() {
  const [services, setServices] = useState({ tarot: [], spell: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tarot");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const data = await fetchServices();

      const tarot = data.filter(
        (s) => s.category?.toUpperCase().trim() === "TAROT"
      );
      const spell = data.filter(
        (s) => s.category?.toUpperCase().trim() === "SPELL"
      );

      setServices({ tarot, spell });
    } catch (err) {
      console.error(err);
      alert("Failed to load services");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6">

      {/* PAGE TITLE */}
      <section className="py-10 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-3">
          Unlock Your Destiny
        </h2>

        <p className="text-slate-600 text-lg max-w-2xl mx-auto">
          Choose your path, explore your future, and discover mystical insights
          tailored just for you.
        </p>
      </section>

      {/* TAB SWITCHER */}
      <div className="flex justify-center mb-10">
        <div className="bg-white/60 backdrop-blur-xl p-2 rounded-full flex gap-3 border border-gray-200 shadow-sm">
          {["tarot", "spell"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-8 py-2 rounded-full font-semibold transition
                ${activeTab === tab
                  ? "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-md scale-105"
                  : "bg-white text-slate-700 hover:bg-gray-100"
                }
              `}
            >
              {tab === "tarot" ? "Tarot" : "Spell"}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT AREA */}
      {loading ? (
        <p className="text-center text-xl text-slate-600">Loading...</p>
      ) : activeTab === "tarot" ? (

        /* TAROT SERVICES */
        <section className="py-6">
          <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">
            Tarot Card Readings
          </h3>
          <div className="h-1 w-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-8"></div>

          {services.tarot.length === 0 ? (
            <p className="text-slate-600 text-lg">No tarot services available ✨</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {services.tarot.map((s) => (
                <ServiceCard key={s._id} service={s} />
              ))}
            </div>
          )}
        </section>

      ) : (

        /* SPELL SERVICES */
        <section className="py-6">
          <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">
            Spells & Magic
          </h3>
          <div className="h-1 w-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-8"></div>

          {services.spell.length === 0 ? (
            <p className="text-slate-600 text-lg">No spells available ✨</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {services.spell.map((s) => (
                <ServiceCard key={s._id} service={s} />
              ))}
            </div>
          )}
        </section>

      )}
    </div>
  );
}
