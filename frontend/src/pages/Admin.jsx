/* ========================= src/pages/Admin.jsx ========================= */
import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";

import {
  fetchBookings,
  fetchServices,
  deleteBooking,
  updateServicePrice,
  updateBookingStatus,
  createService,
  deleteService as deleteServiceApi,
  fetchAvailability,
  createAvailability,
  deleteAvailability,
  // ⭐ PAYMENT APIS (multiple methods)
  fetchPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  togglePaymentMethod,
} from "../api";

export default function Admin() {
  const [bookings, setBookings] = useState([]);
  // 🔹 SNAPSHOTS FOR DASHBOARD
const [snapshots, setSnapshots] = useState([]);

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedBookingId, setExpandedBookingId] = useState(null);

  const [tab, setTab] = useState("tarotBookings");
  const [priceTab, setPriceTab] = useState("tarot");

  const [tarotFilter, setTarotFilter] = useState("pending");
  const [spellFilter, setSpellFilter] = useState("pending");

  const [activeStatusBox, setActiveStatusBox] = useState(null);

  const [tarotSearch, setTarotSearch] = useState("");
  const [spellSearch, setSpellSearch] = useState("");

    // 🔹 NEW: Dashboard filters
  const [dashSearch, setDashSearch] = useState("");
  const [dashServiceFilter, setDashServiceFilter] = useState("all"); // all | TAROT | SPELL

  // Separate ranges for Booked On vs Booked For
  const [dashBookedOnStart, setDashBookedOnStart] = useState("");   // createdAt from
  const [dashBookedOnEnd, setDashBookedOnEnd] = useState("");       // createdAt to
  const [dashBookedForStart, setDashBookedForStart] = useState(""); // date/bookingDate/selectedDate from
  const [dashBookedForEnd, setDashBookedForEnd] = useState("");     // ...to

  // Center popup for filters
  const [isDashFilterModalOpen, setIsDashFilterModalOpen] = useState(false);


  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [toasts, setToasts] = useState([]);

  const [serviceModal, setServiceModal] = useState({
    open: false,
    mode: "create", // "create" | "edit"
    id: null,
    category: "TAROT",
    name: "",
    priceUsd: "",
    priceNpr: "",
    priceInr: "",
    description: "",
  });

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: null, // "booking" | "service" | "multiService"
    id: null,
    ids: [],
    name: "",
  });

  /* ------------------ AVAILABILITY ------------------ */

  const [availabilityCategory, setAvailabilityCategory] = useState("TAROT");
  const [availabilityItems, setAvailabilityItems] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityCalendarValue, setAvailabilityCalendarValue] =
    useState(new Date());

  /* ------------------ PAYMENT METHODS (MULTIPLE) ------------------ */

  // Tab inside payment view: which type list to show
  const [paymentTypeTab, setPaymentTypeTab] = useState("PAYPAL"); // "PAYPAL" | "ESEWA" | "BANK"

  // Loaded from backend (arrays)
  const [paymentMethods, setPaymentMethods] = useState({
    PAYPAL: [],
    ESEWA: [],
    BANK: [],
  });

  // Modal for create/edit payment method
  const [paymentModal, setPaymentModal] = useState({
    open: false,
    mode: "create", // "create" | "edit"
    type: "PAYPAL",
    methodId: null,
    email: "",
    esewaId: "",
    esewaName: "",
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    imageUrl: "",
    imageFile: null, // { dataUrl, name, size }
    imageSizeText: "",
  });

  const [paymentSaving, setPaymentSaving] = useState(false);

  /* ------------------ MODAL GLOBAL FLAG ------------------ */

  const modalOpen =
    serviceModal.open || paymentModal.open || confirmModal.open;

  /* ------------------ STATUS NORMALIZER ------------------ */

  const normalizeStatus = (s) => {
    try {
      if (s && typeof s === "object" && "status" in s) {
        s = s.status;
      }
      if (s == null) return "";
      return String(s).toLowerCase().trim();
    } catch {
      return "";
    }
  };

  const displayStatus = (s) => {
    const n = normalizeStatus(s);
    return n === "delivered" ? "Delivered" : "Pending";
  };

  /* ------------------ DATE UTILS ------------------ */

  const formatDateOnly = (dateInput) => {
    const d = new Date(dateInput);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatDateOnly(new Date());

  const formatBytesToText = (bytes) => {
    if (!bytes && bytes !== 0) return "";
    const kb = bytes / 1024;
    if (kb >= 1024) {
      return `${(kb / 1024).toFixed(1)} MB`;
    }
    return `${Math.round(kb)} KB`;
  };

  const [zoomImage, setZoomImage] = useState(null);

  /* ------------------ TOASTS ------------------ */

  const showToast = (type, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  /* ------------------ LOAD DATA ------------------ */

  useEffect(() => {
    loadAll();
    loadPaymentMethodsData();
    loadSnapshots();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      const [b, s] = await Promise.all([fetchBookings(), fetchServices()]);
      setBookings(b);
      setServices(s);
    } catch {
      showToast("error", "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }

  async function loadPaymentMethodsData() {
    try {
      const pm = await fetchPaymentMethods();
      setPaymentMethods({
        PAYPAL: Array.isArray(pm.PAYPAL) ? pm.PAYPAL : [],
        ESEWA: Array.isArray(pm.ESEWA) ? pm.ESEWA : [],
        BANK: Array.isArray(pm.BANK) ? pm.BANK : [],
      });
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to load payment methods.");
    }
  }

  async function loadSnapshots() {
  try {
    const res = await fetch("http://localhost:5000/api/booking-snapshots");
    const data = await res.json();
    setSnapshots(data);
  } catch (err) {
    console.error("Failed to load snapshots", err);
  }
}


  async function loadAvailabilityForCategory(category) {
    try {
      setAvailabilityLoading(true);
      const data = await fetchAvailability(category);
      setAvailabilityItems(Array.isArray(data) ? data : []);
    } catch {
      showToast("error", "Failed to load availability.");
    } finally {
      setAvailabilityLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "availability")
      loadAvailabilityForCategory(availabilityCategory);
  }, [tab, availabilityCategory]);

  /* ------------------ SCROLL LOCK WHEN MODAL OPEN ------------------ */

  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [modalOpen]);

  /* ------------------ AVAILABILITY ACTIONS ------------------ */

  const handleAvailabilityDateClick = async (date) => {
    const dateStr = formatDateOnly(date);
    setAvailabilityCalendarValue(date);

    if (dateStr < todayStr) {
      showToast("error", "You cannot change past dates.");
      return;
    }

    const existing = availabilityItems.find((a) => a.date === dateStr);

    try {
      if (existing) {
        // REMOVE
        await deleteAvailability(existing._id);
        setAvailabilityItems((prev) =>
          prev.filter((a) => a._id !== existing._id)
        );
        showToast("success", `Marked ${dateStr} as unavailable.`);
      } else {
        // ADD
        const created = await createAvailability({
          category: availabilityCategory,
          date: dateStr,
        });

        setAvailabilityItems((prev) => [
          ...prev,
          {
            _id: created._id || created.id, // <— FIXED
            date: dateStr,
            category: availabilityCategory,
          },
        ]);

        showToast("success", `Marked ${dateStr} as available.`);
      }
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Failed to update availability.";
      showToast("error", msg);
    }
  };

  const handleDeleteAvailabilityDate = async (item) => {
    try {
      await deleteAvailability(String(item._id));
      setAvailabilityItems((prev) =>
        prev.filter((a) => a._id !== item._id)
      );
      showToast("success", `Removed ${item.date}.`);
    } catch {
      showToast("error", "Failed to remove availability date.");
    }
  };

  /* ------------------ PAYMENT MODAL HELPERS ------------------ */

  const resetPaymentModalForm = (overrides = {}) => ({
    open: false,
    mode: "create",
    type: "PAYPAL",
    methodId: null,
    email: "",
    esewaId: "",
    esewaName: "",
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    imageUrl: "",
    imageFile: null,
    imageSizeText: "",
    ...overrides,
  });

  const openAddPaymentModal = () => {
    setPaymentModal(
      resetPaymentModalForm({
        open: true,
        mode: "create",
        type: paymentTypeTab,
      })
    );
  };

  const openEditPaymentModal = (method, type) => {
    setPaymentModal(
      resetPaymentModalForm({
        open: true,
        mode: "edit",
        type,
        methodId: method._id,
        email: method.email || "",
        esewaId: method.esewaId || "",
        esewaName: method.esewaName || "",
        bankName: method.bankName || "",
        bankAccountName: method.bankAccountName || "",
        bankAccountNumber: method.bankAccountNumber || "",
        imageUrl: method.qrImageUrl || "",
        imageFile: null,
        imageSizeText: method.qrImageSize
          ? formatBytesToText(method.qrImageSize)
          : "",
      })
    );
  };

  const closePaymentModal = () => {
    setPaymentModal((prev) => ({ ...prev, open: false }));
  };

  /* ------------------ PAYMENT FILE CHANGE ------------------ */

  const handlePaymentFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      setPaymentModal((prev) => ({
        ...prev,
        imageFile: null,
        imageSizeText: "",
      }));
      return;
    }

    const sizeKB = file.size / 1024;
    const sizeText =
      sizeKB >= 1024
        ? `${(sizeKB / 1024).toFixed(1)} MB`
        : `${Math.round(sizeKB)} KB`;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      setPaymentModal((prev) => ({
        ...prev,
        imageFile: {
          dataUrl,
          name: file.name,
          size: file.size,
        },
        imageSizeText: sizeText,
      }));
    };
    reader.readAsDataURL(file);
  };

  /* ------------------ SAVE / DELETE PAYMENT METHOD ------------------ */

  const handleSavePaymentMethod = async () => {
    const {
      mode,
      type,
      methodId,
      email,
      esewaId,
      esewaName,
      bankName,
      bankAccountName,
      bankAccountNumber,
      imageFile,
      imageUrl,
    } = paymentModal;

    const upperType = type.toUpperCase();

    // ---------- VALIDATION ----------
    if (upperType === "PAYPAL") {
      const hasEmail = email?.trim();
      const hasImage = !!imageFile || !!imageUrl;
      if (!hasEmail && !hasImage) {
        showToast(
          "error",
          "For PayPal, provide at least a PayPal email or a QR image."
        );
        return;
      }
    }

    if (upperType === "ESEWA") {
      const hasId = esewaId?.trim();
      const hasImage = !!imageFile || !!imageUrl;
      if (!hasId && !hasImage) {
        showToast(
          "error",
          "For eSewa, provide at least an eSewa ID or a QR image."
        );
        return;
      }
    }

    if (upperType === "BANK") {
      const hasAllText =
        bankName?.trim() &&
        bankAccountName?.trim() &&
        bankAccountNumber?.trim();

      const hasImage = !!imageFile || !!imageUrl;

      // Confirmed rule: either all text fields OR QR (or both)
      if (!hasAllText && !hasImage) {
        showToast(
          "error",
          "For Bank, either fill Bank Name + Account Holder Name + Account Number OR upload a QR image."
        );
        return;
      }
    }

    // Build payload for backend
    const payload = {};
    if (upperType === "PAYPAL") {
      payload.email = email?.trim() || "";
    }
    if (upperType === "ESEWA") {
      payload.esewaId = esewaId?.trim() || "";
      payload.esewaName = esewaName?.trim() || "";
    }
    if (upperType === "BANK") {
      payload.bankName = bankName?.trim() || "";
      payload.bankAccountName = bankAccountName?.trim() || "";
      payload.bankAccountNumber = bankAccountNumber?.trim() || "";
    }

    if (imageFile?.dataUrl) {
      payload.qrImage = imageFile.dataUrl;
      payload.qrImageName = imageFile.name;
      payload.qrImageSize = imageFile.size; // keep original size in bytes
    }

    try {
      setPaymentSaving(true);

      if (mode === "create") {
        await createPaymentMethod(upperType, payload);
        showToast("success", "Payment method added.");
      } else {
        await updatePaymentMethod(upperType, methodId, payload);
        showToast("success", "Payment method updated.");
      }

      await loadPaymentMethodsData();
      closePaymentModal();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to save payment method.";
      showToast("error", msg);
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleDeletePaymentMethod = async (type, id) => {
    try {
      await deletePaymentMethod(type.toUpperCase(), id);
      await loadPaymentMethodsData();
      showToast("success", "Payment method deleted.");
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to delete payment method.");
    }
  };

  /* ------------------ TOGGLE PAYMENT ------------------ */
  const handleTogglePayment = async (type, id) => {
    try {
      await togglePaymentMethod(type.toUpperCase(), id);
      await loadPaymentMethodsData();
      showToast("success", "Active method updated.");
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to update active method.");
    }
  };

  /* ------------------ HELPERS ------------------ */

  const getCategory = (serviceName) => {
    const found = services.find((s) => s.name === serviceName);
    return found ? found.category?.toUpperCase() : "";
  };

  const formatDateTime = (d) => {
    if (!d) return "Unknown";
    const dateObj = new Date(d);
    return (
      dateObj.toLocaleDateString() +
      " – " +
      dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const formatWhatsAppNumber = (value) => {
    if (!value) return "";
    const str = String(value).trim();

    // Match "+<country><number>" or "+<country> <number>"
    const match = str.match(/^\+?(\d{1,5})\s*(\d+)$/);
    if (!match) return str; // if pattern is weird, just show as-is

    const countryCode = match[1];
    const number = match[2];
    return `+${countryCode} ${number}`;
  };

  // 🔹 NEW: Export bookings as CSV but named .xls
  const exportBookingsToExcel = (list, filename) => {
  if (!Array.isArray(list) || list.length === 0) {
    showToast("error", "No bookings to export.");
    return;
  }

  // NEW → Added Category + Prices
  const header = [
    "Created At",
    "Booked For",
    "Name",
    "WhatsApp",
    "Email",
    "Instagram",
    "Service Name",
    "Category",
    "Price USD",
    "Price NPR",
    "Price INR",
    "Status"
  ];

  const escapeCsv = (value) => {
    if (value == null) return "";
    const s = String(value);
    if (/[",\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = list.map((b) => {
    const createdAtText = formatDateTime(
      b.createdAt || b.date || b.bookingDate || b.selectedDate
    );

    const bookedForRaw = b.date || b.bookingDate || b.selectedDate;
    const bookedForText = bookedForRaw ? formatDateOnly(bookedForRaw) : "";

    const category =
      b.service?.category ||
      b.category ||
      "";

    const whatsappText = b.whatsapp
      ? formatWhatsAppNumber(
          `${b.countryCode || ""} ${b.whatsapp}`.trim()
        )
      : "";

    return [
      createdAtText,
      bookedForText,
      b.fullName || "",
      whatsappText,
      b.email || "",
      b.instaId || "",
      b.service?.name || b.serviceName || "",
      category || "",
      b.priceUsd || "",
      b.priceNpr || "",
      b.priceInr || "",
      displayStatus(b.status),
    ].map(escapeCsv);
  });

  const csvContent = [
    header.join(","),
    ...rows.map((r) => r.join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


  /* ------------------ BOOKINGS FILTERING ------------------ */

  const tarotBookings = bookings.filter(
  (b) => b.service?.category === "TAROT"
);


  const spellBookings = bookings.filter(
  (b) => b.service?.category === "SPELL"
);


  const tarotPendingAll = tarotBookings.filter(
    (b) => normalizeStatus(b.status) === "pending"
  );
  const tarotDeliveredAll = tarotBookings.filter(
    (b) => normalizeStatus(b.status) === "delivered"
  );

  const spellPendingAll = spellBookings.filter(
    (b) => normalizeStatus(b.status) === "pending"
  );
  const spellDeliveredAll = spellBookings.filter(
    (b) => normalizeStatus(b.status) === "delivered"
  );

  /* ------------------ SERVICE ACTIONS ------------------ */

  const toggleServiceSelection = (id) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clearSelectedServices = () => setSelectedServiceIds([]);

  const openMultiDeleteServicesModal = () => {
    if (selectedServiceIds.length === 0) return;
    setConfirmModal({
      open: true,
      type: "multiService",
      id: null,
      ids: selectedServiceIds,
      name: `${selectedServiceIds.length} services`,
    });
  };

  const openDeleteServiceModal = (service) => {
    setConfirmModal({
      open: true,
      type: "service",
      id: service._id,
      ids: [],
      name: service.name,
    });
  };

  const openCreateServiceModal = (category) => {
    setServiceModal({
      open: true,
      mode: "create",
      id: null,
      category,
      name: "",
      priceUsd: "",
      priceNpr: "",
      priceInr: "",
      description: "",
    });
  };

  const openEditServiceModal = (service) => {
    setServiceModal({
      open: true,
      mode: "edit",
      id: service._id,
      category: service.category,
      name: service.name,
      priceUsd: service.priceUsd ?? "",
      priceNpr: service.priceNpr ?? "",
      priceInr: service.priceInr ?? "",
      description: service.description ?? "",
    });
  };

  const closeServiceModal = () => {
    setServiceModal((prev) => ({ ...prev, open: false }));
  };

  const handleSaveService = async () => {
    const { id, mode, category, name, priceUsd, priceNpr, priceInr, description } =
      serviceModal;

    if (!name.trim()) {
      showToast("error", "Service name is required.");
      return;
    }

    if (!description.trim()) {
      showToast("error", "Service description is required.");
      return;
    }

    if (!priceUsd && !priceNpr && !priceInr) {
      showToast("error", "Enter at least one price.");
      return;
    }

    try {
      if (mode === "create") {
        await createService({
          name: name.trim(),
          category,
          description: description?.trim() || "",
          priceUsd: priceUsd ? Number(priceUsd) : null,
          priceNpr: priceNpr ? Number(priceNpr) : null,
          priceInr: priceInr ? Number(priceInr) : null,
        });
        showToast("success", "Service created.");
      } else {
        await updateServicePrice(id, {
          name: name.trim(),
          description: description?.trim() || "",
          priceUsd: priceUsd ? Number(priceUsd) : null,
          priceNpr: priceNpr ? Number(priceNpr) : null,
          priceInr: priceInr ? Number(priceInr) : null,
        });
        showToast("success", "Service updated.");
      }

      await loadAll();
      closeServiceModal();
    } catch (err) {
      const msg =
        err.response?.data?.error || err.message || "Failed to save service.";
      showToast("error", msg);
    }
  };

  /* ------------------ CONFIRM DELETE ------------------ */

  const handleConfirmDelete = async () => {
    const { type, id, ids } = confirmModal;

    try {
      if (type === "booking") {
        await deleteBooking(id);
      } else if (type === "service") {
        await deleteServiceApi(id);
      } else if (type === "multiService") {
        await Promise.all(ids.map((svcId) => deleteServiceApi(svcId)));
        clearSelectedServices();
      }

      await loadAll();
      showToast("success", "Deleted successfully.");
    } catch {
      showToast("error", "Failed to delete.");
    } finally {
      setConfirmModal({ open: false, type: null, id: null, ids: [], name: "" });
    }
  };

  /* ------------------ UPDATE BOOKING STATUS ------------------ */

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateBookingStatus(id, { status: status.toLowerCase() });
      await loadAll();
      setActiveStatusBox(null);
      showToast("success", "Status updated.");
    } catch {
      showToast("error", "Failed to update status.");
    }
  };

  /* ------------------ GMAIL-STYLE DATE ------------------ */

  const formatGmailDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();

    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    // Any other day → "29 Nov"
    return d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
  };

  /* ======================= BOOKING CARD (UPDATED) ======================= */
const BookingCard = ({ b, showImages = true, noStatusChange = false, noDelete = false }) => {
  const open = expandedBookingId === b._id;
  const [statusDropdown, setStatusDropdown] = useState(false);

  // ---------------- NEW FIX ----------------
  const liveService = services.find((s) => s._id === b.service?.id);
  const displayName = liveService?.name || b.service?.name || "Unknown Service";
  // -----------------------------------------

  const contactCollapsed = b.whatsapp
    ? formatWhatsAppNumber(b.whatsapp)
    : b.instaId
    ? `@${b.instaId}`
    : b.email || "No contact";

  const collapsedDate = formatGmailDate(b.createdAt);
  const currentDisplayStatus = displayStatus(b.status);

  const renderPrice = () => {
  // If card contains snapshot price fields, use them
  if (b.priceUsd || b.priceNpr || b.priceInr) {
    const arr = [];
    if (b.priceUsd) arr.push(`$${b.priceUsd}`);
    if (b.priceNpr) arr.push(`NPR ${b.priceNpr}`);
    if (b.priceInr) arr.push(`INR ${b.priceInr}`);
    return arr.join(" / ");
  }

  // Otherwise (normal tarot/spell bookings) → use live service
  if (!liveService) return "N/A";

  const arr = [];
  if (liveService.priceUsd) arr.push(`$${liveService.priceUsd}`);
  if (liveService.priceNpr) arr.push(`NPR ${liveService.priceNpr}`);
  if (liveService.priceInr) arr.push(`INR ${liveService.priceInr}`);
  return arr.join(" / ");
};


  const deleteClick = (e) => {
    e.stopPropagation();
    setConfirmModal({
      open: true,
      type: "booking",
      id: b._id,
      ids: [],
      name: b.fullName,
    });
  };

  /* ========= STATUS DROPDOWN ========= */
  const StatusDropdown = ({ value, onChange }) => {
    const isDelivered = value === "Delivered";
    const [open, setOpen] = useState(false);

    return (
      <div className="relative inline-block z-[999999]">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpen((prev) => !prev);
          }}
          className={`
            px-3 py-1 pr-6 rounded-full text-[11px] sm:text-sm font-semibold
            border flex items-center gap-2 bg-black/40
            ${isDelivered
              ? "border-green-400 text-green-400"
              : "border-yellow-400 text-yellow-300"}
          `}
        >
          {value}
          <span className="text-[12px]">{open ? "⯅" : "⯆"}</span>
        </button>

        {open && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="
              absolute left-0 bottom-full mb-1 w-full 
              bg-black/90 backdrop-blur-xl
              border border-purple-300/40
              rounded-xl overflow-hidden shadow-2xl z-[9999999]
            "
          >
            {value !== "Pending" && (
              <div
                className="px-3 py-2 hover:bg-white/10 cursor-pointer text-yellow-300 text-xs sm:text-sm"
                onClick={() => {
                  onChange("Pending");
                  setOpen(false);
                }}
              >
                Pending
              </div>
            )}

            {value !== "Delivered" && (
              <div
                className="px-3 py-2 hover:bg-white/10 cursor-pointer text-green-400 text-xs sm:text-sm"
                onClick={() => {
                  onChange("Delivered");
                  setOpen(false);
                }}
              >
                Delivered
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  /* =================== MAIN CARD =================== */
  return (
    <div className="
      border border-purple-300/20 rounded-xl 
      bg-black/30 backdrop-blur-xl mb-6 
      relative overflow-visible z-[20]
    ">
      {/* HEADER */}
      <div
        onClick={() => {
          if (open) setExpandedBookingId(null);
          else setExpandedBookingId(b._id);
        }}
        className="p-4 sm:p-5 cursor-pointer select-none flex flex-col gap-2"
      >
        {/* COLLAPSED */}
        {!open ? (
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[12px] sm:text-sm text-purple-200">
            <span className="text-yellow-300 text-lg sm:text-xl shrink-0">▸</span>

            <span className="font-semibold truncate max-w-[150px] sm:max-w-[250px]">
              {b.fullName}
            </span>

            <span className="whitespace-nowrap">{contactCollapsed}</span>

            {/* ---------- UPDATED NAME HERE ---------- */}
            <span className="whitespace-nowrap">{displayName}</span>
            {/* ---------------------------------------- */}

            <span className="whitespace-nowrap">{renderPrice()}</span>
          </div>
        ) : (
          /* EXPANDED */
          <div className="flex items-start gap-3 sm:gap-4 text-[12px] sm:text-sm text-purple-200">
            <span className="text-yellow-300 text-lg sm:text-xl shrink-0 mt-[2px]">
              ▾
            </span>

            <div className="flex-1 min-w-0">
              <div className="font-semibold leading-snug whitespace-normal break-words">
                {b.fullName}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] sm:text-xs text-purple-200">
                <span className="break-all">{contactCollapsed}</span>

                {/* ---------- UPDATED NAME HERE ---------- */}
                <span className="break-all">{displayName}</span>
                {/* ---------------------------------------- */}

                <span className="break-all">{renderPrice()}</span>
              </div>
            </div>
          </div>
        )}

        {/* STATUS / DATE / DELETE */}
        <div className="flex flex-wrap justify-between items-center pl-7 pr-1 gap-y-2 mt-1">
          {noStatusChange ? (
            <span
              className={`px-3 py-1 rounded-full text-[11px] sm:text-sm font-semibold ${
                currentDisplayStatus === "Delivered"
                  ? "bg-green-600 text-white"
                  : "bg-yellow-400 text-black"
              }`}
            >
              {currentDisplayStatus}
            </span>
          ) : (
            <StatusDropdown
              value={currentDisplayStatus}
              onChange={(val) => handleStatusUpdate(b._id, val)}
            />
          )}

          <div className="flex items-center gap-3 text-[12px] sm:text-sm text-purple-200">
            {!noDelete && (
              <button
  onClick={deleteClick}
  className="
    w-10 h-10 flex items-center justify-center
    rounded-full 
    bg-red-600 hover:bg-red-700 
    text-white 
    shadow-[0_0_18px_rgba(255,0,0,0.8)]
    active:scale-95 transition
  "
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M6 7h12v14H6z" opacity=".3" />
    <path d="M8 9h8v10H8z" />
    <path d="M15.5 4l-.71-.71A.995.995 0 0014.17 3H9.83c-.27 0-.52.11-.71.29L8.41 4H5v2h14V5c0-.55-.45-1-1-1h-3.5z" />
  </svg>
</button>

            )}
            <span>{collapsedDate}</span>
          </div>
        </div>
      </div>

      {/* EXPANDED DETAILS */}
      {open && (
        <div className="px-6 pb-6 pt-2 space-y-4 text-[12px] sm:text-sm text-purple-200">
          <div className="flex flex-wrap gap-4">
            <span>
              <strong>Booked On:</strong> {formatDateTime(b.createdAt)}
            </span>

            {(b.date || b.bookingDate || b.selectedDate) && (
              <span>
                <strong>Booked For:</strong>{" "}
                {formatDateOnly(b.date || b.bookingDate || b.selectedDate)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-8">
            <span>
              <strong>Email:</strong> {b.email || "(no email provided)"}
            </span>
          </div>

          {/* IMAGES */}
          {showImages &&
            Array.isArray(b.clientImages) &&
            b.clientImages.length > 0 && (
              <div className="mt-3">
                <strong className="block mb-2 text-purple-300">
                  Client Images:
                </strong>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {b.clientImages.map((img, index) => (
                    <div
                      key={index}
                      className="bg-black/40 border border-purple-300/30 rounded-xl p-2 overflow-hidden"
                    >
                      <img
                        src={img.dataUrl}
                        alt=""
                        className="w-full h-32 object-contain rounded cursor-pointer hover:opacity-80 transition"
                        onClick={() => setZoomImage(img.dataUrl)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* PAYMENT PROOF */}
          {showImages &&
            Array.isArray(b.paymentProofImages) &&
            b.paymentProofImages.length > 0 && (
              <div className="mt-5">
                <strong className="block mb-2 text-green-300">
                  Payment Proof:
                </strong>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {b.paymentProofImages.map((img, index) => (
                    <div
                      key={index}
                      className="bg-black/40 border border-green-300/30 rounded-xl p-2 overflow-hidden"
                    >
                      <img
                        src={img.dataUrl}
                        alt=""
                        className="w-full h-32 object-contain rounded cursor-pointer hover:opacity-80 transition"
                        onClick={() => setZoomImage(img.dataUrl)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
};


  /* ------------------ RENDER TAROT BOOKINGS ------------------ */

  const renderTarotBookings = () => {
    const search = tarotSearch.trim().toLowerCase();

    const filteredBase = tarotBookings.filter((b) => {
      if (!search) return true;
      return (
        b.fullName?.toLowerCase().includes(search) ||
        b.whatsapp?.toLowerCase().includes(search) ||
        b.email?.toLowerCase().includes(search) ||
        b.instaId?.toLowerCase().includes(search)
      );
    });

    const listToShow =
      tarotFilter === "pending"
        ? filteredBase.filter((b) => normalizeStatus(b.status) === "pending")
        : filteredBase.filter((b) => normalizeStatus(b.status) === "delivered");

    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold text.white">
            Tarot Bookings
          </h2>

          {/* REFRESH BUTTON */}
          <button
            onClick={() => loadAll()}
            className="
      flex items-center gap-2 
      bg-purple-600 hover:bg-purple-700 
      text-white px-3 py-1.5 sm:px-4 sm:py-2 
      rounded-lg text-xs sm:text-sm font-semibold
      shadow-md active:scale-95 transition
    "
          >
            🔄 Refresh
          </button>
        </div>

        <input
          type="text"
          className="
            w-full sm:w-96 
            px-3 py-2 sm:py-2 
            rounded-lg 
            text-xs sm:text-sm text-white
            placeholder:text-[11px] sm:placeholder:text-sm
            bg-black/30 border border-purple-300/40
            focus:outline-none focus:ring-2 focus:ring-yellow-400
            mb-4
          "
          placeholder="Search by name, WhatsApp, Instagram Id or email"
          value={tarotSearch}
          onChange={(e) => setTarotSearch(e.target.value)}
        />

        <div className="flex gap-3 mb-5">
          <button
            onClick={() => setTarotFilter("pending")}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm ${
              tarotFilter === "pending"
                ? "bg-yellow-400 text-black"
                : "bg-gray-300 text-black"
            }`}
          >
            Pending ({tarotPendingAll.length})
          </button>

          <button
            onClick={() => setTarotFilter("delivered")}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm ${
              tarotFilter === "delivered"
                ? "bg-green-500 text-white"
                : "bg-gray-300 text-black"
            }`}
          >
            Delivered ({tarotDeliveredAll.length})
          </button>
        </div>

        {listToShow.map((b) => (
          <BookingCard
            key={b._id}
            b={b}
            showImages={true}
          />
        ))}

        {listToShow.length === 0 && <p>No tarot bookings found.</p>}
      </>
    );
  };

  /* ------------------ RENDER SPELL BOOKINGS ------------------ */

  const renderSpellBookings = () => {
    const search = spellSearch.trim().toLowerCase();

    const filteredBase = spellBookings.filter((b) => {
      if (!search) return true;
      return (
        b.fullName?.toLowerCase().includes(search) ||
        b.whatsapp?.toLowerCase().includes(search) ||
        b.email?.toLowerCase().includes(search) ||
        b.instaId?.toLowerCase().includes(search)
      );
    });

    const listToShow =
      spellFilter === "pending"
        ? filteredBase.filter((b) => normalizeStatus(b.status) === "pending")
        : filteredBase.filter((b) => normalizeStatus(b.status) === "delivered");

    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Spell Bookings
          </h2>

          {/* REFRESH BUTTON */}
          <button
            onClick={() => loadAll()}
            className="
      flex items-center gap-2 
      bg-purple-600 hover:bg-purple-700 
      text-white px-3 py-1.5 sm:px-4 sm:py-2 
      rounded-lg text-xs sm:text-sm font-semibold
      shadow-md active:scale-95 transition
    "
          >
            🔄 Refresh
          </button>
        </div>

        <input
          type="text"
          className="
            w-full sm:w-96 
            px-3 py-2 sm:py-2 
            rounded-lg 
            text-xs sm:text-sm text-white
            placeholder:text-[11px] sm:placeholder:text-sm
            bg-black/30 border border-purple-300/40
            focus:outline-none focus:ring-2 focus:ring-yellow-400
            mb-4
          "
          placeholder="Search by name, WhatsApp, Instagram Id or email"
          value={spellSearch}
          onChange={(e) => setSpellSearch(e.target.value)}
        />

        <div className="flex gap-3 mb-5">
          <button
            onClick={() => setSpellFilter("pending")}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm ${
              spellFilter === "pending"
                ? "bg-yellow-400 text-black"
                : "bg-gray-300 text-black"
            }`}
          >
            Pending ({spellPendingAll.length})
          </button>

          <button
            onClick={() => setSpellFilter("delivered")}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm ${
              spellFilter === "delivered"
                ? "bg-green-500 text-white"
                : "bg-gray-300 text-black"
            }`}
          >
            Delivered ({spellDeliveredAll.length})
          </button>
        </div>

        {listToShow.map((b) => (
          <BookingCard
            key={b._id}
            b={b}
            showImages={true}
          />
        ))}

        {listToShow.length === 0 && <p>No spell bookings found.</p>}
      </>
    );
  };

    /* ------------------ RENDER DASHBOARD (LATEST 10) ------------------ */

  const renderDashboardBookings = () => {
    const search = dashSearch.trim().toLowerCase();

    const filteredAll = snapshots
      .filter((b) => {
        // SEARCH
        if (search) {
          const haystack = [
            b.fullName,
            b.whatsapp,
            b.email,
            b.instaId,
            b.countryCode,
            b.service?.name,
          ]
            .map((v) => (v || "").toString().toLowerCase())
            .join(" ");
          if (!haystack.includes(search)) return false;
        }

        // SERVICE FILTER
        if (dashServiceFilter !== "all") {
  const snapCategory =
    b.service?.category ||    // for normal bookings
    b.category ||             // for snapshot database
    "";

  if (snapCategory !== dashServiceFilter) return false;
}



        // DATE FILTERS
        const createdAt = b.createdAt ? new Date(b.createdAt) : null;
        const bookedForRaw = b.date || b.bookingDate || b.selectedDate;
        const bookedFor = bookedForRaw ? new Date(bookedForRaw) : null;

        // ---- Booked On (Created Date) range ----
        if (dashBookedOnStart) {
          const start = new Date(dashBookedOnStart + "T00:00:00");
          if (!createdAt || createdAt < start) return false;
        }
        if (dashBookedOnEnd) {
          const end = new Date(dashBookedOnEnd + "T23:59:59");
          if (!createdAt || createdAt > end) return false;
        }

        // ---- Booked For (Client selected date) range ----
        if (dashBookedForStart) {
          const start = new Date(dashBookedForStart + "T00:00:00");
          if (!bookedFor || bookedFor < start) return false;
        }
        if (dashBookedForEnd) {
          const end = new Date(dashBookedForEnd + "T23:59:59");
          if (!bookedFor || bookedFor > end) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const da = new Date(a.createdAt || a.date || 0);
        const db = new Date(b.createdAt || b.date || 0);
        return db - da; // newest first
      });

    const latest10 = filteredAll.slice(0, 10);

    // Download all snapshots
const handleDownloadAll = () =>
  exportBookingsToExcel(snapshots, "all_snapshots.xls");

// Download filtered snapshot list
const handleDownloadFiltered = () =>
  exportBookingsToExcel(filteredAll, "filtered_snapshots.xls");


    return (
      <>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            All Bookings
          </h2>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownloadAll}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow"
            >
              ⬇ Download All (.xls)
            </button>
            <button
              onClick={handleDownloadFiltered}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-semibold shadow"
            >
              ⬇ Download Filtered (.xls)
            </button>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* SEARCH (longer on desktop) */}
          <input
            type="text"
            placeholder="Search name, WhatsApp, email, insta, services..."
            className="
              px-4 py-2 rounded-xl bg-black/30 text-white border border-purple-300/40
              w-full sm:flex-1 lg:w-[520px]
              text-xs sm:text-sm
            "
            value={dashSearch}
            onChange={(e) => setDashSearch(e.target.value)}
          />

          {/* SERVICE DROPDOWN (transparent / premium) */}
          <select
            className="
              px-3 py-2 rounded-xl
              bg-black
              text-white text-xs sm:text-sm
              border border-purple-300/60
              focus:outline-none focus:ring-2 focus:ring-yellow-400
            "
            value={dashServiceFilter}
            onChange={(e) => setDashServiceFilter(e.target.value)}
          >
            <option value="all">All Services</option>
            <option value="TAROT">Tarot</option>
            <option value="SPELL">Spell</option>
          </select>

          {/* FILTER ICON BUTTON (opens center popup) */}
          <button
            onClick={() => setIsDashFilterModalOpen(true)}
            className="
              w-9 h-9 rounded-xl
              bg-black/40 border border-purple-300/70
              flex items-center justify-center
              shadow-md
              hover:bg-purple-600/40 hover:border-yellow-300
              transition
            "
            title="More filters"
          >
            {/* Funnel icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 4h18l-7 8v6l-4 2v-8L3 4z" />
            </svg>
          </button>
        </div>

        {/* LIST */}
        {latest10.length === 0 ? (
          <p className="text-purple-100 text-sm">No bookings found.</p>
        ) : (
          latest10.map((snap) => {
  const mapped = {
    _id: snap.bookingId,            // BookingCard expects _id
    fullName: snap.fullName,
    whatsapp: snap.whatsapp,
    email: snap.email,
    instaId: snap.instaId,
    createdAt: snap.createdAt,
    status: snap.status,

    // BOOKED FOR DATE
    date: snap.bookedFor,

    // SERVICE INFO
    service: {
      name: snap.serviceName,
      category: snap.category,
    },

    // SNAPSHOT PRICES
    priceUsd: snap.priceUsd,
    priceNpr: snap.priceNpr,
    priceInr: snap.priceInr,

    // no images in dashboard
    clientImages: [],
    paymentProofImages: [],
  };

  return (
    <BookingCard
      key={snap._id}
      b={mapped}
      showImages={false}
      noStatusChange={true}
      noDelete={true}
    />
  );
})

        )}
      </>
    );
  };


  /* ------------------ RENDER EDIT SERVICES ------------------ */

  const renderEditServices = () => {
    const filteredServices =
      priceTab === "tarot"
        ? services.filter((s) => s.category === "TAROT")
        : services.filter((s) => s.category === "SPELL");

    return (
      <>
        <h2 className="text-3xl font-bold mb-6 text-white">Manage Services</h2>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setPriceTab("tarot")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              priceTab === "tarot"
                ? "bg-purple-600 text-white"
                : "bg-purple-200 text-black"
            }`}
          >
            Tarot
          </button>

          <button
            onClick={() => setPriceTab("spell")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              priceTab === "spell"
                ? "bg-yellow-500 text.black"
                : "bg-yellow-200 text-black"
            }`}
          >
            Spell
          </button>
        </div>

        <button
          onClick={() =>
            openCreateServiceModal(priceTab === "tarot" ? "TAROT" : "SPELL")
          }
          className={`mb-6 px-5 py-2 rounded-lg font-semibold shadow-lg ${
            priceTab === "tarot"
              ? "bg-purple-600 text-white"
              : "bg-yellow-500 text-black"
          }`}
        >
          + Add New {priceTab === "tarot" ? "Tarot" : "Spell"} Service
        </button>

        <div className="space-y-3">
          {filteredServices.map((s) => {
            const checked = selectedServiceIds.includes(s._id);

            return (
              <div
                key={s._id}
                className="flex items-center bg-black bg-opacity-10 backdrop-blur-xl border border-purple-300/20 px-4 py-3 rounded-xl text-white"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleServiceSelection(s._id)}
                    className="w-4 h-4 mt-1 shrink-0"
                  />

                  <div className="min-w-0">
                    <div className="font-semibold truncate">{s.name}</div>
                    {s.description && (
                      <div className="text-xs text-purple-100 mt-1 line-clamp-2">
                        {s.description}
                      </div>
                    )}
                    <div className="text-yellow-300 font-semibold mt-1 whitespace-nowrap">
                      {s.priceUsd ? `$ ${s.priceUsd}` : ""}
                      {s.priceUsd && (s.priceNpr || s.priceInr) ? " / " : ""}

                      {s.priceNpr ? `NPR ${s.priceNpr}` : ""}
                      {s.priceNpr && s.priceInr ? " / " : ""}

                      {s.priceInr ? `INR ${s.priceInr}` : ""}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <button
                    onClick={() => openEditServiceModal(s)}
                    className="bg-gray-700 text-white px-3 py-1 rounded-lg text-sm"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => openDeleteServiceModal(s)}
                    className="bg-red-600 text.white px-3 py-1 rounded-lg text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}

          {filteredServices.length === 0 && (
            <p className="text-purple-200">No services found.</p>
          )}
        </div>
      </>
    );
  };

  /* ------------------ AVAILABILITY VIEW ------------------ */

  const renderAvailability = () => {
    const sortedAvailability = (availabilityItems || [])
      .filter((item) => item?.date != null)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));

    return (
      <>
        <h2 className="text-3xl font-bold mb-4 text-white">Availability</h2>

        <div className="flex gap-4 mb-2">
          <button
            onClick={() => setAvailabilityCategory("TAROT")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              availabilityCategory === "TAROT"
                ? "bg-purple-600 text-white"
                : "bg-purple-200 text-black"
            }`}
          >
            Tarot
          </button>

          <button
            onClick={() => setAvailabilityCategory("SPELL")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              availabilityCategory === "SPELL"
                ? "bg-yellow-500 text-black"
                : "bg-yellow-200 text-black"
            }`}
          >
            Spell
          </button>
        </div>

        <p className="text-sm text-purple-100 mb-4">
          <span className="font-semibold">
            {availabilityCategory === "TAROT"
              ? "Tarot Availability Date"
              : "Spell Availability Date"}
          </span>
        </p>

        <div className="grid md:grid-cols-[320px,1fr] gap-6 items-start">
          <div className="bg-slate-900/80 border border-purple-300/40 rounded-2xl p-3 shadow-xl">
            <p className="text-sm text-purple-100 mb-2">
              Click a future date to toggle availability.
            </p>

            <div className="bg-slate-950 rounded-2xl p-2 overflow-hidden w-full">
              <Calendar
                onChange={(value) =>
                  handleAvailabilityDateClick(
                    value instanceof Date ? value : value[0]
                  )
                }
                value={availabilityCalendarValue}
                minDate={new Date()}
                className="mystery-calendar w-full"
                tileClassName={({ date, view }) => {
                  const dateStr = formatDateOnly(date);
                  if (view !== "month") return null;

                  const isPast = dateStr < todayStr;
                  const isAvailable = availabilityItems.some(
                    (a) => a.date === dateStr
                  );

                  if (isPast) return "mystery-calendar-tile-past";
                  if (isAvailable) return "mystery-calendar-tile-available";
                  return "mystery-calendar-tile";
                }}
              />
            </div>

            <p className="text-xs text-purple-100 mt-2">
              Selected: {formatDateOnly(availabilityCalendarValue)}
            </p>
          </div>

          <div className="bg-black bg-opacity-30 border border-purple-300/30 rounded-2xl p-4">
            <h3 className="text-lg font-semibold mb-3">Available Dates</h3>

            {availabilityLoading ? (
              <p className="text-sm text-purple-200">Loading...</p>
            ) : sortedAvailability.length === 0 ? (
              <p className="text-sm text-purple-200">
                No available dates yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {sortedAvailability.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between bg.white/5 border border-purple-300/30 rounded-xl px-3 py-2 text-sm bg-white/5"
                  >
                    <span>{item.date}</span>
                    <button
                      onClick={() => handleDeleteAvailabilityDate(item)}
                      className="text-xs bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  /* ------------------ PAYMENT METHODS VIEW (NEW) ------------------ */

  const renderPaymentMethods = () => {
    const currentType = paymentTypeTab;
    const list = paymentMethods[currentType] || [];

    const labelForType = (t) => {
      if (t === "PAYPAL") return "PayPal";
      if (t === "ESEWA") return "eSewa";
      if (t === "BANK") return "Bank";
      return t;
    };

    return (
      <>
        <h2 className="text-3xl font-bold mb-6 text-white flex items-center gap-3">
          Payment Methods
          <span className="text-sm bg-purple-600/40 border border-purple-300/50 px-3 py-1 rounded-xl">
            {paymentMethods.PAYPAL.length +
              paymentMethods.ESEWA.length +
              paymentMethods.BANK.length}{" "}
            total
          </span>
        </h2>

        {/* Tabs + Add Button */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 max-w-4xl">
          <div className="inline-flex bg-black/50 border border-purple-300/40 rounded-xl overflow-hidden">
            <button
              onClick={() => setPaymentTypeTab("PAYPAL")}
              className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 ${
                paymentTypeTab === "PAYPAL"
                  ? "bg-blue-500 text-white"
                  : "text-blue-200"
              }`}
            >
              PayPal
              <span className="bg-white/20 text-white px-2 py-[2px] rounded-md text-[11px]">
                {paymentMethods.PAYPAL.length}
              </span>
            </button>

            <button
              onClick={() => setPaymentTypeTab("ESEWA")}
              className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 ${
                paymentTypeTab === "ESEWA"
                  ? "bg-emerald-500 text-white"
                  : "text-emerald-200"
              }`}
            >
              eSewa
              <span className="bg-white/20 text-white px-2 py-[2px] rounded-md text-[11px]">
                {paymentMethods.ESEWA.length}
              </span>
            </button>

            <button
              onClick={() => setPaymentTypeTab("BANK")}
              className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 ${
                paymentTypeTab === "BANK"
                  ? "bg-yellow-500 text-black"
                  : "text-yellow-200"
              }`}
            >
              Bank
              <span className="bg-white/20 text-white px-2 py-[2px] rounded-md text-[11px]">
                {paymentMethods.BANK.length}
              </span>
            </button>
          </div>

          <button
            onClick={openAddPaymentModal}
            className="self-start md:self-auto px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-lg"
          >
            + Add New {labelForType(paymentTypeTab)} Method
          </button>
        </div>

        <p className="text-xs text-purple-100 mb-4 max-w-3xl">
          All payment methods are stored separately. You can add multiple
          PayPal, eSewa or Bank methods. QR is optional, but:
          <br />
          <span className="font-semibold">PayPal</span> – email or QR required.
          <br />
          <span className="font-semibold">eSewa</span> – ID or QR required.
          <br />
          <span className="font-semibold">Bank</span> – either Bank Name +
          Account Holder Name + Account Number or QR (or both).
        </p>

        {/* List */}
        <div className="bg-black bg-opacity-40 border border-purple-300/30 rounded-2xl p-4 max-w-4xl">
          {list.length === 0 ? (
            <p className="text-sm text-purple-100">
              No {labelForType(paymentTypeTab)} methods added yet.
            </p>
          ) : (
            <div className="space-y-3">
              {list.map((m) => {
                const hasQr = !!m.qrImageUrl;
                return (
                  <div
                    key={m._id}
                    className="flex flex-col md:flex-row items-start md:items-center gap-3 bg-slate-950/60 border border-purple-300/40 rounded-xl p-3"
                  >
                    {/* QR BOX */}
                    <div className="flex-shrink-0">
                      <div
                        className="
                          w-28 h-28 
                          bg-black/70 
                          border border-yellow-300/70 
                          rounded-2xl 
                          flex items-center justify-center 
                          overflow-hidden 
                          shadow-[0_0_25px_rgba(250,204,21,0.45)]
                        "
                      >
                        {hasQr ? (
                          <img
                            src={m.qrImageUrl}
                            alt="QR"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-[10px] text-yellow-100 text-center px-2">
                            No QR image
                          </span>
                        )}
                      </div>
                      {m.qrImageSize && (
                        <p className="mt-1 text-[10px] text-purple-100 text-center">
                          Size: {formatBytesToText(m.qrImageSize)}
                        </p>
                      )}
                    </div>

                    {/* TEXT INFO */}
                    <div className="flex-1 min-w-0 text-sm text-purple-50">
                      <p className="text-xs uppercase tracking-wide text-purple-300">
                        {labelForType(paymentTypeTab)}
                      </p>

                      {paymentTypeTab === "PAYPAL" && (
                        <>
                          <p className="font-semibold mt-1">
                            Email:{" "}
                            {m.email ? (
                              <span className="text-white">{m.email}</span>
                            ) : (
                              <span className="text-yellow-200">
                                (QR only, no email)
                              </span>
                            )}
                          </p>
                        </>
                      )}

                      {paymentTypeTab === "ESEWA" && (
                        <>
                          <p className="font-semibold mt-1">
                            eSewa ID:{" "}
                            {m.esewaId ? (
                              <span className="text-white">{m.esewaId}</span>
                            ) : (
                              <span className="text-yellow-200">—</span>
                            )}
                          </p>
                          <p className="mt-1">
                            Name:{" "}
                            {m.esewaName ? (
                              <span className="text-white">{m.esewaName}</span>
                            ) : (
                              <span className="text-purple-200">
                                (optional)
                              </span>
                            )}
                          </p>
                        </>
                      )}

                      {paymentTypeTab === "BANK" && (
                        <>
                          <p className="font-semibold mt-1">
                            Bank:{" "}
                            {m.bankName ? (
                              <span className="text-white">{m.bankName}</span>
                            ) : (
                              <span className="text-yellow-200">
                                (QR only / no bank name)
                              </span>
                            )}
                          </p>
                          <p className="mt-1">
                            Account Holder:{" "}
                            {m.bankAccountName ? (
                              <span className="text-white">
                                {m.bankAccountName}
                              </span>
                            ) : (
                              <span className="text-purple-200">
                                (optional)
                              </span>
                            )}
                          </p>
                          <p className="mt-1">
                            Account Number:{" "}
                            {m.bankAccountNumber ? (
                              <span className="text-white">
                                {m.bankAccountNumber}
                              </span>
                            ) : (
                              <span className="text-yellow-200">
                                (QR only / not provided)
                              </span>
                            )}
                          </p>
                        </>
                      )}

                      <p className="mt-2 text-[11px] text-purple-200">
                        {hasQr ? "QR available" : "No QR stored"}
                      </p>
                    </div>

                    {/* ACTION BUTTONS + TOGGLE */}
                    <div className="flex flex-col gap-3 items-end md:items-center md:ml-4">
                      {/* iPhone Style Toggle */}
                      <div
                        onClick={() => handleTogglePayment(currentType, m._id)}
                        className={`
      w-12 h-6 rounded-full p-1 cursor-pointer relative transition-all 
      ${m.isActive ? "bg-emerald-500" : "bg-gray-600"}
    `}
                      >
                        <div
                          className={`
        w-5 h-5 bg-white rounded-full shadow-md transform transition-all 
        ${m.isActive ? "translate-x-6" : "translate-x-0"}
      `}
                        ></div>
                      </div>

                      <button
                        onClick={() => openEditPaymentModal(m, currentType)}
                        className="px-3 py-1 rounded-lg text-xs bg-gray-700 hover:bg-gray-600 text-white w-full"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          handleDeletePaymentMethod(currentType, m._id)
                        }
                        className="px-3 py-1 rounded-lg text-xs bg-red-600 hover:bg-red-700 text.white w-full"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  };

  /* ------------------ MAIN LAYOUT (RESPONSIVE + STICKY NAV) ------------------ */

  return (
    <div className="admin-wrapper min-h-screen bg-black text-white">
      {/* TOASTS */}
      <div className="fixed bottom-4 right-4 space-y-2 z-[30000] pointer-events-auto">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow-xl text-sm font-semibold text-white flex items-center gap-2
              ${
                t.type === "success"
                  ? "bg-emerald-500/90"
                  : t.type === "error"
                  ? "bg-red-500/90"
                  : "bg-slate-700/90"
              }
            `}
          >
            {t.message}
          </div>
        ))}
      </div>

      <div className="min-h-screen flex flex-col sm:flex-row">
        {/* MOBILE NAV */}
        <div
          className={`
            sm:hidden 
            sticky top-[64px] left-0 
            z-[9999]
            bg-[#0a0014]/95 
            backdrop-blur-xl
            border-b border-purple-300/20
            flex justify-around 
            px-2 py-3
            ${modalOpen ? "pointer-events-none blur-sm opacity-40" : ""}
          `}
        >
          <button
            onClick={() => setTab("tarotBookings")}
            className={`px-3 py-2 rounded text-xs font-semibold ${
              tab === "tarotBookings"
                ? "bg-purple-600 text-white"
                : "bg-slate-800 text-purple-100"
            }`}
          >
            Tarot
          </button>

          <button
            onClick={() => setTab("spellBookings")}
            className={`px-3 py-2 rounded text-xs font-semibold ${
              tab === "spellBookings"
                ? "bg-yellow-500 text-black"
                : "bg-slate-800 text-yellow-100"
            }`}
          >
            Spell
          </button>

          <button
            onClick={() => setTab("prices")}
            className={`px-3 py-2 rounded text-xs font-semibold ${
              tab === "prices"
                ? "bg-gray-100 text-black"
                : "bg-slate-800 text-gray-100"
            }`}
          >
            Services
          </button>

          <button
            onClick={() => setTab("availability")}
            className={`px-3 py-2 rounded text-xs font-semibold ${
              tab === "availability"
                ? "bg-emerald-500 text-white"
                : "bg-slate-800 text-emerald-100"
            }`}
          >
            Availability
          </button>

          <button
            onClick={() => setTab("payments")}
            className={`px-3 py-2 rounded text-xs font-semibold ${
              tab === "payments"
                ? "bg-blue-500 text-white"
                : "bg-slate-800 text-blue-100"
            }`}
          >
            Payments
          </button>
        </div>

        {/* DESKTOP SIDEBAR */}
        <div
          className={`
            hidden sm:flex flex-col space-y-4 
            fixed left-6 top-1/2 -translate-y-1/2 
            bg-[#050017]/85 
            backdrop-blur-xl 
            border border-purple-300/30 
            rounded-2xl 
            shadow-2xl
            p-5
            w-48
            z-[999]
            ${modalOpen ? "pointer-events-none blur-sm opacity-40" : ""}
          `}
        >
          <button
            onClick={() => setTab("tarotBookings")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              tab === "tarotBookings"
                ? "bg-purple-600 text-white"
                : "bg-purple-200 text-black"
            }`}
          >
            Tarot Bookings
          </button>

          <button
            onClick={() => setTab("spellBookings")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              tab === "spellBookings"
                ? "bg-yellow-500 text-black"
                : "bg-yellow-200 text-black"
            }`}
          >
            Spell Bookings
          </button>

          <button
            onClick={() => setTab("prices")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              tab === "prices"
                ? "bg-gray-700 text-white"
                : "bg-gray-300 text-black"
            }`}
          >
            Edit Services
          </button>

          <button
            onClick={() => setTab("availability")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              tab === "availability"
                ? "bg-emerald-500 text-white"
                : "bg-emerald-200 text-black"
            }`}
          >
            Availability
          </button>

          <button
            onClick={() => setTab("payments")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              tab === "payments"
                ? "bg-blue-500 text-white"
                : "bg-blue-200 text-black"
            }`}
          >
            Payment Methods
          </button>
        </div>

        {/* MAIN CONTENT */}
        <div
          className={`
            flex-1 p-4 sm:pl-[260px] sm:pr-8 sm:py-8 text-white overflow-y-auto
            ${modalOpen ? "pointer-events-none opacity-40" : ""}
          `}
        >
          <div className="w-full flex justify-center mb-6">
            <button
              onClick={() => setTab("dashboard")}
              className="bg-red-600 text-white font-bold px-4 py-2 rounded-lg shadow-md inline-block hover:bg-red-700 transition cursor-pointer text-sm sm:text-base"
            >
              Welcome Admin
            </button>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : tab === "tarotBookings" ? (
            renderTarotBookings()
          ) : tab === "spellBookings" ? (
            renderSpellBookings()
          ) : tab === "prices" ? (
            renderEditServices()
          ) : tab === "payments" ? (
            renderPaymentMethods()
          ) : tab === "dashboard" ? (
            renderDashboardBookings()
          ) : (
            renderAvailability()
          )}
        </div>
      </div>

      {/* STICKY BOTTOM MULTI-ACTION BAR */}
      {tab === "prices" && selectedServiceIds.length > 0 && !modalOpen && (
        <div
          className="
          fixed bottom-6 left-1/2 -translate-x-1/2 
          bg-black/60 backdrop-blur-xl 
          border border-purple-300/30 
          rounded-2xl shadow-2xl 
          px-6 py-3 
          flex items-center gap-6 
          z-[180]
        "
        >
          <span className="text-white font-semibold">
            {selectedServiceIds.length} selected
          </span>

          <button
            onClick={openMultiDeleteServicesModal}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Delete Selected
          </button>

          <button
            onClick={clearSelectedServices}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
          >
            Clear
          </button>
        </div>
      )}

      {/* SERVICE MODAL (CREATE / EDIT) */}
      {serviceModal.open && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[10000]"
          onClick={closeServiceModal}
        >
          <div
            className="bg-slate-900/90 border border-purple-400/40 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">
              {serviceModal.mode === "create"
                ? `Add New ${
                    serviceModal.category === "TAROT" ? "Tarot" : "Spell"
                  } Service`
                : `Edit ${
                    serviceModal.category === "TAROT" ? "Tarot" : "Spell"
                  } Service`}
            </h3>

            <label className="text-sm">Service Name</label>
            <input
              type="text"
              value={serviceModal.name}
              onChange={(e) =>
                setServiceModal((p) => ({ ...p, name: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg text-white bg-black/20 mb-3"
            />

            <label className="text-sm">Description</label>
            <textarea
              value={serviceModal.description}
              onChange={(e) =>
                setServiceModal((p) => ({
                  ...p,
                  description: e.target.value,
                }))
              }
              className="w-full px-3 py-2 rounded-lg text-white bg-black/20 mb-3 h-24"
            />

            <label className="text-sm">Price USD</label>
            <input
              type="number"
              value={serviceModal.priceUsd}
              onChange={(e) =>
                setServiceModal((p) => ({ ...p, priceUsd: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg text-white bg-black/20 mb-3"
            />

            <label className="text-sm">Price NPR</label>
            <input
              type="number"
              value={serviceModal.priceNpr}
              onChange={(e) =>
                setServiceModal((p) => ({ ...p, priceNpr: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg text-white bg-black/20 mb-5"
            />

            <label className="text-sm">Price INR</label>
            <input
              type="number"
              value={serviceModal.priceInr}
              onChange={(e) =>
                setServiceModal((p) => ({ ...p, priceInr: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg text-white bg-black/20 mb-5"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={closeServiceModal}
                className="px-4 py-2 rounded-lg bg-gray-600 text-white"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveService}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold"
              >
                {serviceModal.mode === "create" ? "Create" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT METHOD MODAL */}
      {paymentModal.open && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[10000]"
          onClick={closePaymentModal}
        >
          <div
            className="bg-slate-950/95 border border-purple-400/50 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 text-white">
              {paymentModal.mode === "create"
                ? `Add New ${
                    paymentModal.type === "PAYPAL"
                      ? "PayPal"
                      : paymentModal.type === "ESEWA"
                      ? "eSewa"
                      : "Bank"
                  } Payment Method`
                : `Edit ${
                    paymentModal.type === "PAYPAL"
                      ? "PayPal"
                      : paymentModal.type === "ESEWA"
                      ? "eSewa"
                      : "Bank"
                  } Payment Method`}
            </h3>

            {/* TYPE SELECT (lock when editing to keep logic simpler) */}
            <label className="text-sm font-semibold text-purple-100">
              Payment Type
            </label>
            <select
              value={paymentModal.type}
              disabled={paymentModal.mode === "edit"}
              onChange={(e) =>
                setPaymentModal((prev) => ({
                  ...prev,
                  type: e.target.value,
                }))
              }
              className={`mt-1 mb-4 w-full px-3 py-2 rounded-lg bg-black/40 text-white border border-purple-300/40 ${
                paymentModal.mode === "edit"
                  ? "opacity-60 cursor-not-allowed"
                  : ""
              }`}
            >
              <option value="PAYPAL">PayPal</option>
              <option value="ESEWA">eSewa</option>
              <option value="BANK">Bank</option>
            </select>

            {/* TYPE-SPECIFIC FIELDS */}
            {paymentModal.type === "PAYPAL" && (
              <div className="mb-4">
                <label className="text-sm block text-purple-100">
                  PayPal Email{" "}
                  <span className="text-xs text-purple-300">
                    (optional if QR is uploaded)
                  </span>
                </label>
                <input
                  type="email"
                  value={paymentModal.email}
                  onChange={(e) =>
                    setPaymentModal((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 rounded-lg text.white bg-black/40 border border-purple-300/30 text-white"
                />
              </div>
            )}

            {paymentModal.type === "ESEWA" && (
              <div className="mb-4 grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm block text-purple-100">
                    eSewa ID
                  </label>
                  <input
                    type="text"
                    value={paymentModal.esewaId}
                    onChange={(e) =>
                      setPaymentModal((prev) => ({
                        ...prev,
                        esewaId: e.target.value,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 rounded-lg text-white bg-black/40 border border-purple-300/30"
                  />
                </div>
                <div>
                  <label className="text-sm block text-purple-100">
                    eSewa Name{" "}
                    <span className="text-xs text-purple-300">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={paymentModal.esewaName}
                    onChange={(e) =>
                      setPaymentModal((prev) => ({
                        ...prev,
                        esewaName: e.target.value,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 rounded-lg text-white bg-black/40 border border-purple-300/30"
                  />
                </div>
              </div>
            )}

            {paymentModal.type === "BANK" && (
              <div className="mb-4 space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm block text-purple-100">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={paymentModal.bankName}
                      onChange={(e) =>
                        setPaymentModal((prev) => ({
                          ...prev,
                          bankName: e.target.value,
                        }))
                      }
                      className="mt-1 w-full px-3 py-2 rounded-lg text-white bg-black/40 border border-purple-300/30"
                    />
                  </div>
                  <div>
                    <label className="text-sm block text-purple-100">
                      Account Holder Name{" "}
                      <span className="text-xs text-purple-300">
                        (optional, unless no QR)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={paymentModal.bankAccountName}
                      onChange={(e) =>
                        setPaymentModal((prev) => ({
                          ...prev,
                          bankAccountName: e.target.value,
                        }))
                      }
                      className="mt-1 w-full px-3 py-2 rounded-lg text-white bg-black/40 border border-purple-300/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm block text-purple-100">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={paymentModal.bankAccountNumber}
                    onChange={(e) =>
                      setPaymentModal((prev) => ({
                        ...prev,
                        bankAccountNumber: e.target.value,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 rounded-lg text-white bg-black/40 border border-purple-300/30"
                  />
                </div>
              </div>
            )}

            {/* QR UPLOAD AREA */}
            <div className="mt-2">
              <p className="text-xs text-purple-200 mb-2">
                Upload QR (JPG, PNG, etc.) – optional. Original file size is
                kept. After choosing a file, we show its size below.
              </p>

              <div
                className="
                  bg-black/70 
                  border border-yellow-300/60 
                  rounded-2xl 
                  p-3 
                  flex flex-col gap-2
                  shadow-[0_0_25px_rgba(250,204,21,0.4)]
                "
              >
                <label className="text-sm font-semibold text-yellow-100">
                  QR Image (optional)
                </label>

                <div className="bg-black/60 rounded-xl p-2 flex items-center gap-3">
                  <div className="flex-1">
                    {/* Custom Styled File Input */}
                    <div className="flex flex-col gap-2">
                      {/* Upload Button */}
                      <label
                        htmlFor="qrUpload"
                        className="
                          bg-yellow-500 text-black 
                          px-4 py-2 rounded-xl font-semibold 
                          cursor-pointer text-center
                          shadow-[0_0_15px_rgba(250,204,21,0.45)]
                          hover:bg-yellow-400 transition
                        "
                      >
                        Upload QR Image
                      </label>

                      {/* Hidden Input */}
                      <input
                        id="qrUpload"
                        type="file"
                        accept="image/*"
                        onChange={handlePaymentFileChange}
                        className="hidden"
                      />

                      {/* File Name & Size */}
                      <div
                        className="
                          bg-black/40 border border-purple-300/30 
                          rounded-xl p-3 text-sm text-purple-100
                        "
                      >
                        {paymentModal.imageFile ? (
                          <>
                            <p className="truncate">
                              <span className="text-purple-300">
                                Selected:
                              </span>{" "}
                              {paymentModal.imageFile.name}
                            </p>
                            <p className="text-xs text-purple-300 mt-1">
                              Size: {paymentModal.imageSizeText}
                            </p>
                          </>
                        ) : paymentModal.imageUrl ? (
                          <>
                            <p className="truncate">
                              <span className="text-purple-300">
                                Saved QR Image
                              </span>
                            </p>
                            <p className="text-xs text-purple-300 mt-1">
                              (Click upload to replace)
                            </p>
                          </>
                        ) : (
                          <p className="text-purple-300">No file selected</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="w-20 h-20 bg-black/80 border border-purple-300/50 rounded-xl flex items-center justify-center overflow-hidden">
                    {paymentModal.imageFile?.dataUrl ? (
                      <img
                        src={paymentModal.imageFile.dataUrl}
                        alt="QR preview"
                        className="w-full h-full object-contain"
                      />
                    ) : paymentModal.imageUrl ? (
                      <img
                        src={paymentModal.imageUrl}
                        alt="QR preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-[9px] text-purple-200 text-center px-1">
                        No preview
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* MODAL BUTTONS */}
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={closePaymentModal}
                className="px-4 py-2 rounded-lg bg-gray-600 text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePaymentMethod}
                disabled={paymentSaving}
                className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold shadow-lg"
              >
                {paymentSaving
                  ? "Saving..."
                  : paymentModal.mode === "create"
                  ? "Add Payment Method"
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

            {/* DASHBOARD FILTER MODAL (CENTER POPUP) */}
      {isDashFilterModalOpen && (
        <div
          className="fixed inset-0 z-[12000] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => setIsDashFilterModalOpen(false)}
        >
          <div
            className="bg-slate-950/95 border border-purple-400/60 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-2 text-white">
              Filter Bookings
            </h3>
            <p className="text-xs text-purple-200 mb-4">
              You can filter by the date the booking was{" "}
              <span className="font-semibold text-yellow-300">created</span>{" "}
              (<span className="font-semibold">Booked On</span>) and/or the date
              selected by the client (
              <span className="font-semibold">Booked For</span>).
              <br />
              Leave any range empty if you don&apos;t want to filter by it.
            </p>

            <div className="space-y-5">
              {/* BOOKED ON (CREATED DATE) */}
              <div>
                <h4 className="text-sm font-semibold text-yellow-300 mb-2">
                  Date Booked On (Created Date)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-purple-200 mb-1">
                      From
                    </label>
                    <input
                      type="date"
                      value={dashBookedOnStart}
                      onChange={(e) => setDashBookedOnStart(e.target.value)}
                      className="
                        w-full px-3 py-2 rounded-lg
                        bg-transparent
                        border border-purple-300/50
                        text-white text-sm
                        focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400
                      "
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-purple-200 mb-1">
                      To
                    </label>
                    <input
                      type="date"
                      value={dashBookedOnEnd}
                      onChange={(e) => setDashBookedOnEnd(e.target.value)}
                      className="
                        w-full px-3 py-2 rounded-lg
                        bg-transparent
                        border border-purple-300/50
                        text-white text-sm
                        focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400
                      "
                    />
                  </div>
                </div>
              </div>

              {/* BOOKED FOR (CLIENT DATE) */}
              <div>
                <h4 className="text-sm font-semibold text-emerald-300 mb-2">
                  Date Booked For (Client Selected)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-purple-200 mb-1">
                      From
                    </label>
                    <input
                      type="date"
                      value={dashBookedForStart}
                      onChange={(e) => setDashBookedForStart(e.target.value)}
                      className="
                        w-full px-3 py-2 rounded-lg
                        bg-transparent
                        border border-purple-300/50
                        text-white text-sm
                        focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400
                      "
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-purple-200 mb-1">
                      To
                    </label>
                    <input
                      type="date"
                      value={dashBookedForEnd}
                      onChange={(e) => setDashBookedForEnd(e.target.value)}
                      className="
                        w-full px-3 py-2 rounded-lg
                        bg-transparent
                        border border-purple-300/50
                        text-white text-sm
                        focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400
                      "
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between gap-3">
              <button
                onClick={() => {
                  setDashBookedOnStart("");
                  setDashBookedOnEnd("");
                  setDashBookedForStart("");
                  setDashBookedForEnd("");
                }}
                className="px-4 py-2 rounded-lg bg-slate-700 text-white text-sm hover:bg-slate-600"
              >
                Clear Filters
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsDashFilterModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-600 text-white text-sm hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsDashFilterModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-lg"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ================= IMAGE ZOOM MODAL ================= */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-[20000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="relative bg-black/90 border border-purple-300/30 rounded-2xl p-4 max-w-[90vw] max-h-[90vh] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* BIG IMAGE */}
            <img
              src={zoomImage}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />

            {/* DOWNLOAD BUTTON */}
            <a
              href={zoomImage}
              download="image.jpg"
              className="
          mt-4 block w-full text-center 
          bg-purple-600 hover:bg-purple-700 
          text-white font-semibold py-2 rounded-lg
          transition
        "
            >
              Download Image
            </a>

            {/* CLOSE BUTTON */}
            <button
              onClick={() => setZoomImage(null)}
              className="
          absolute top-2 right-2 
          w-8 h-8 rounded-full 
          bg-black/70 hover:bg-black/90 
          text-white text-lg font-bold
          flex items-center justify-center
          transition
        "
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmModal.open && (
        <div
          className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-md flex items-center justify-center"
          onClick={() =>
            setConfirmModal({
              open: false,
              type: null,
              id: null,
              ids: [],
              name: "",
            })
          }
        >
          <div
            className="bg-slate-900/90 border border-red-400/40 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">Confirm Delete</h3>

            <p className="mb-4 text-sm text-red-100">
              Are you sure you want to delete{" "}
              {confirmModal.type === "booking"
                ? "this booking"
                : confirmModal.type === "service"
                ? "this service"
                : "these services"}
              ?
              <br />
              <span className="font-semibold">{confirmModal.name}</span>
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setConfirmModal({
                    open: false,
                    type: null,
                    id: null,
                    ids: [],
                    name: "",
                  })
                }
                className="px-4 py-2 rounded-lg bg-gray-600 text-white"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
