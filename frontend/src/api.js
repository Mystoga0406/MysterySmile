/* ========================= src/api.js ========================= */

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

/* ========================= SERVICES ========================= */

export async function fetchServices() {
  const res = await fetch(`${API_BASE}/services`);
  if (!res.ok) throw new Error("Failed to fetch services");
  return res.json();
}

export async function updateServicePrice(id, data) {
  const res = await fetch(`${API_BASE}/services/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to update service");
  return json;
}

export async function createService(service) {
  const res = await fetch(`${API_BASE}/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(service),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to create service");
  return json;
}

export async function deleteService(id) {
  const res = await fetch(`${API_BASE}/services/${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to delete service");
  return json;
}

/* ========================= PAYMENT METHODS (MULTIPLE) ========================= */
/*
  Backend routes:
    GET    /payment-methods
    POST   /payment-methods/:type
    PUT    /payment-methods/:type/:id
    DELETE /payment-methods/:type/:id
    PUT    /payment-methods/:type/:id/toggle   <-- ACTIVE SWITCH
*/

export async function fetchPaymentMethods() {
  const res = await fetch(`${API_BASE}/payment-methods`);
  if (!res.ok) throw new Error("Failed to fetch payment methods");
  return res.json();
}

export async function createPaymentMethod(type, payload) {
  const res = await fetch(`${API_BASE}/payment-methods/${type}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to create payment method");
  return json;
}

export async function updatePaymentMethod(type, id, payload) {
  const res = await fetch(`${API_BASE}/payment-methods/${type}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to update payment method");
  return json;
}

export async function deletePaymentMethod(type, id) {
  const res = await fetch(`${API_BASE}/payment-methods/${type}/${id}`, {
    method: "DELETE",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to delete payment method");
  return json;
}

/*  
   ✔ NEW: Toggle active payment method
   ✔ Works with backend route: PUT /payment-methods/:type/:id/toggle
   ✔ Only 1 active per category (PayPal, Esewa, Bank)
*/
export async function togglePaymentMethod(type, id) {
  const res = await fetch(`${API_BASE}/payment-methods/${type}/${id}/toggle`, {
    method: "PUT",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to toggle");
  return json;
}

/* ========================= AVAILABILITY ========================= */

export async function fetchAvailability(category) {
  const res = await fetch(`${API_BASE}/availability/${category}`);
  if (!res.ok) throw new Error("Failed to fetch availability");
  return res.json();
}

export async function createAvailability({ category, date }) {
  const res = await fetch(`${API_BASE}/availability`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, date }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to create availability");
  return json;
}



export async function deleteAvailability(id) {
  const res = await fetch(`${API_BASE}/availability/${id}`, {
    method: "DELETE",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to delete availability");
  return json;
}

/* ========================= BOOKINGS ========================= */

export async function createBooking(booking) {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(booking),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to create booking");
  return json;
}

export async function fetchBookings() {
  const res = await fetch(`${API_BASE}/bookings`);
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return res.json();
}

export async function deleteBooking(id) {
  const res = await fetch(`${API_BASE}/bookings/${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to delete booking");
  return json;
}

export async function updateBookingStatus(id, status) {
  const res = await fetch(`${API_BASE}/bookings/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to update status");
  return json;
}

export async function turnOffPaymentMethods(type) {
  const res = await fetch(`${API_BASE}/payment-methods/${type}/turnoff`, {
    method: "PUT"
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to turn off");
  return json;
}

export async function fetchBookingSnapshots() {
  const res = await fetch("http://localhost:5000/api/booking-snapshots");
  return res.json();
}

