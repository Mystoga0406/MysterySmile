/* ========================= src/pages/Booking.jsx ========================= */
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  fetchServices,
  createBooking,
  fetchAvailability,
  fetchPaymentMethods,
} from '../api'
import Calendar from 'react-calendar'

export default function Booking() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)

  const [contactMode, setContactMode] = useState('whatsapp')

  const [formData, setFormData] = useState({
    fullName: '',
    countryCode: '',
    whatsapp: '',
    instaId: '',
    email: '',
    address: '',
  })

  const [availableDates, setAvailableDates] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [calendarValue, setCalendarValue] = useState(new Date())

  const attemptExitToHome = () => {
  setShowExitModal(true);
  return; // Stop immediate navigation
};


  // ---------------- PAYMENT METHODS (FROM ADMIN) ----------------
  const [paymentMethods, setPaymentMethods] = useState({
    PAYPAL: [],
    ESEWA: [],
    BANK: [],
  })
  const [paymentChoice, setPaymentChoice] = useState('')

  // ---------------- IMAGES (CLIENT & PAYMENT PROOF) ----------------
  const [clientImages, setClientImages] = useState([]) // [{ name, sizeKB, type, dataUrl }]
  const [paymentProofImages, setPaymentProofImages] = useState([]) // same structure

  // ---------------- QR ZOOM ----------------
  const [zoomImage, setZoomImage] = useState(null)

  // ---------------- TOAST ----------------
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'error',
  })

  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: '', type })
    }, 2600)
  }

  const formatDateOnly = (dateInput) => {
    const d = new Date(dateInput)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(d.getDate()).padStart(2, '0')}`
  }

  // Helper: file -> base64
  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  // Generic handler for images
  const handleImageUpload = async (e, target) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    try {
      const processed = await Promise.all(
        files.map(async (file) => {
          const dataUrl = await fileToDataUrl(file)
          return {
            name: file.name,
            type: file.type,
            sizeKB: Math.round(file.size / 1024),
            dataUrl,
          }
        })
      )

      if (target === 'client') {
        setClientImages((prev) => [...prev, ...processed])
      } else if (target === 'paymentProof') {
        setPaymentProofImages((prev) => [...prev, ...processed])
      }
    } catch (err) {
      console.error('Image upload error:', err)
      showToast('Failed to read selected image(s). Please try again.', 'error')
    } finally {
      // allow selecting same file again if needed
      e.target.value = ''
    }
  }

  const removeImage = (index, target) => {
    if (target === 'client') {
      setClientImages((prev) => prev.filter((_, i) => i !== index))
    } else if (target === 'paymentProof') {
      setPaymentProofImages((prev) => prev.filter((_, i) => i !== index))
    }
  }

  // ---------------- LOAD SERVICE + PAYMENT METHODS ----------------
  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const services = await fetchServices()
        const found = services.find((s) => s._id === id || s.id === id)
        setService(found)

        if (found) {
          const dates = await fetchAvailability(found.category)
          setAvailableDates(dates.map((d) => d.date))
        }

        // Load active payment methods only
        try {
          const pm = await fetchPaymentMethods()
          setPaymentMethods({
            PAYPAL: Array.isArray(pm.PAYPAL)
              ? pm.PAYPAL.filter((m) => m.isActive)
              : [],
            ESEWA: Array.isArray(pm.ESEWA)
              ? pm.ESEWA.filter((m) => m.isActive)
              : [],
            BANK: Array.isArray(pm.BANK)
              ? pm.BANK.filter((m) => m.isActive)
              : [],
          })
        } catch (err) {
          console.error('Failed to load payment methods:', err)
          showToast('Could not load payment options. Please refresh.', 'error')
        }
      } catch (err) {
        console.error(err)
        showToast('Failed to load service', 'error')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  // ---------------- BACK BUTTON ----------------
  useEffect(() => {
    const handlePopState = () => {
      setShowExitModal(true)
      window.history.pushState(null, '', window.location.href)
    }

    window.history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // ---------------- EXIT HANDLER FOR NAVBAR (Logo / Home) ----------------
useEffect(() => {
  window.onBookingExitAttempt = () => {
    setShowExitModal(true);  // shows same popup
  };

  return () => {
    window.onBookingExitAttempt = null; // cleanup
  };
}, []);


  // ---------------- INPUT CHANGE ----------------
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // ---------------- CALENDAR ----------------
  const handleCalendarSelect = (date) => {
    const d = formatDateOnly(date)
    if (!availableDates.includes(d)) return
    setSelectedDate(d)
    setCalendarValue(date)
  }

  // ---------------- BUILD PAYMENT INFO ----------------
  const buildPaymentInfoForBooking = () => {
    if (!paymentChoice) return null

    const pm = paymentMethods[paymentChoice]?.[0]

    if (!pm) return { type: paymentChoice }

    if (paymentChoice === 'PAYPAL') {
      return {
        type: 'PAYPAL',
        paymentMethodId: pm._id,
        email: pm.email || '',
        hasQr: !!pm.qrImageUrl,
      }
    }

    if (paymentChoice === 'ESEWA') {
      return {
        type: 'ESEWA',
        paymentMethodId: pm._id,
        esewaId: pm.esewaId || '',
        esewaName: pm.esewaName || '',
        hasQr: !!pm.qrImageUrl,
      }
    }

    if (paymentChoice === 'BANK') {
      return {
        type: 'BANK',
        paymentMethodId: pm._id,
        bankName: pm.bankName || '',
        bankAccountName: pm.bankAccountName || '',
        bankAccountNumber: pm.bankAccountNumber || '',
        hasQr: !!pm.qrImageUrl,
      }
    }

    return { type: paymentChoice }
  }

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!service) return

    if (!selectedDate) {
      showToast('Please select an available date.', 'error')
      return
    }

    if (!paymentChoice) {
      showToast('Please select a payment option.', 'error')
      return
    }

    if (paymentProofImages.length === 0) {
      showToast('Please upload your payment proof (screenshot / image).', 'error')
      return
    }

    if (clientImages.length === 0) {
  showToast('Please upload at least one client image.', 'error')
  return
}


    try {
      const booking = {
        ...formData,
        whatsapp:
          contactMode === 'whatsapp'
            ? `+${formData.countryCode.trim()} ${formData.whatsapp.trim()}`
            : null,
        instaId: contactMode === 'instagram' ? formData.instaId : null,
        contactMode,
        service: {
  id: service._id || service.id,
  name: service.name,          // permanent
  category: service.category,  // permanent
},

        selectedDate,
        tags: [],
        createdAt: new Date(),
        payment: buildPaymentInfoForBooking(),

        // new fields
        clientImages, // all uploaded reference images
        paymentProofImages, // all uploaded payment proof images
      }

      await createBooking(booking)
      setShowSuccessModal(true)
    } catch (err) {
      console.error(err)
      showToast('Failed to create booking', 'error')
    }
  }

  if (loading) return <div className="container mx-auto px-6">Loading...</div>
  if (!service)
    return <div className="container mx-auto px-6">Service not found</div>

  // ✔ USE ACTIVE METHODS
  const activePaypal = paymentMethods.PAYPAL[0] || null
  const activeEsewa = paymentMethods.ESEWA[0] || null
  const activeBank = paymentMethods.BANK[0] || null

  const hasPaypal = !!activePaypal
  const hasEsewa = !!activeEsewa
  const hasBank = !!activeBank

  return (
    <>
      {/* TOAST */}
      {toast.show && (
        <div
          style={{ transform: 'translate(-50%, 0)' }}
          className={`fixed top-6 left-1/2 px-6 py-3 rounded-xl z-[9999] 
          text-white font-semibold shadow-xl backdrop-blur-xl border border-white/20 
          animate-toastDrop ${
            toast.type === 'error' ? 'bg-red-600/90' : 'bg-green-600/90'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="container mx-auto px-6 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8 mt-8">
          {/* BACK BUTTON */}
          {/* HEADER ROW: back button + centered title */}
<div className="flex items-center justify-center relative mb-6">

  {/* Smaller Back Button (left aligned) */}
  <button
    type="button"
    onClick={() => setShowExitModal(true)}
    className="absolute left-0 bg-red-500 text-white font-semibold px-3 py-1.5 
               rounded-xl hover:bg-red-600 transition text-sm"
  >
    ⟵
  </button>

  {/* Title centered regardless of button width */}
  <h3 className="text-lg sm:text-xl font-bold text-black text-center">
    {service.name}
  </h3>
</div>


          {/* DESCRIPTION */}
          <div className="relative mb-6 rounded-2xl p-6 bg-gray-700/20 backdrop-blur-xl border border-white/10 shadow-xl">
  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-pink-300/20 to-yellow-300/20 blur-2xl pointer-events-none"></div>

  <div className="relative">
    <h4 className="text-black font-semibold mb-2">Description:</h4>

    <p className="text-black/80 text-left text-[11px] leading-[1.35] sm:text-base">
      {service.description}
    </p>
  </div>
</div>


          {/* DATES */}
          <div className="mb-6">
            <label className="block text-green-600 mb-2 font-semibold text-xs">
              Green Are The Available Dates
            </label>

            {availableDates.length === 0 ? (
              <p className="text-red-600 font-semibold bg-white/60 p-3 rounded-lg text-sm">
                No available dates for this service. Please try again later.
              </p>
            ) : (
              <div className="bg-black/20 p-3 rounded-xl border border-black/30">
                <Calendar
                  onChange={handleCalendarSelect}
                  value={calendarValue}
                  className="w-full mystery-calendar"
                  tileDisabled={({ date }) => {
                    const d = formatDateOnly(date)
                    return !availableDates.includes(d)
                  }}
                  tileClassName={({ date, view }) => {
                    if (view !== 'month') return ''
                    const d = formatDateOnly(date)
                    return availableDates.includes(d)
                      ? 'booking-date-available'
                      : 'booking-date-unavailable'
                  }}
                />

                <p className="text-black mt-2 text-xs">
                  Selected:{' '}
                  {selectedDate ? (
                    <span className="font-bold">{selectedDate}</span>
                  ) : (
                    <span className="text-red-600 font-semibold">None</span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* FULL NAME */}
            <div>
              <label className="block text-black mb-2">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-lg bg-white border border-black/40 text-black focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
            </div>

            {/* CONTACT METHOD */}
            <div className="mb-4">
              <label className="block text-black mb-2 font-semibold">
                Preferred Contact Method
              </label>

              <select
                value={contactMode}
                onChange={(e) => setContactMode(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white border border-black/40 text-black focus:outline-none focus:ring-2 focus:ring-yellow-300"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>

            {/* CONDITIONAL WHATSAPP FIELD */}
            {contactMode === 'whatsapp' && (
              <div>
                <label className="block text-black mb-2">WhatsApp Number</label>
                <div className="flex gap-2">
                  <div className="flex items-center w-24 px-3 py-3 rounded-lg bg-white border border-black/40 text-black">
                    <span className="text-black mr-1">+</span>
                    <input
                      type="tel"
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          countryCode: e.target.value.replace(/\D/g, ''),
                        })
                      }
                      placeholder="91"
                      maxLength={5}
                      className="w-full bg-transparent text-black focus:outline-none"
                    />
                  </div>

                  <input
                    type="tel"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        whatsapp: e.target.value.replace(/\D/g, ''),
                      })
                    }
                    placeholder="Enter phone number"
                    className="w-full px-4 py-3 rounded-lg bg-white border border-black/40 text-black focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  />
                </div>
              </div>
            )}

            {/* INSTAGRAM FIELD */}
            {contactMode === 'instagram' && (
              <div>
                <label className="block text-black mb-2">Instagram ID</label>

                <div className="flex items-center px-4 py-3 rounded-lg bg-white border border-black/40 text-black">
                  <span className="text-black mr-1">@</span>
                  <input
                    type="text"
                    name="instaId"
                    value={formData.instaId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        instaId: e.target.value.replace(/[^\w.]/g, ''),
                      })
                    }
                    placeholder="yourhandle"
                    className="flex-1 bg-transparent text-black focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* EMAIL */}
            <div>
              <label className="block text-black mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-lg bg-white border border-black/40 text-black focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
            </div>

            {/* ADDRESS */}
            <div>
              <label className="block text-black mb-2">Current Address</label>
              <textarea
                rows="3"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                placeholder="Enter your current address"
                className="w-full px-4 py-3 rounded-lg bg-white border border-black/40 text-black focus:outline-none focus:ring-2 focus:ring-yellow-300"
              ></textarea>
            </div>

            {/* -------- CLIENT IMAGES (REFERENCE) -------- */}
            <div className="mt-4">
              <label className="block text-black mb-2 font-semibold">
                UPLOAD YOUR FACE IMAGE (REQUIRED)
              </label>
              <p className="text-xs text-gray-600 mb-2">
                If there are multiple people included in this reading or spell,
                please upload a clear image of each person.
              </p>

              <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-xl px-4 py-6 bg-white hover:border-purple-400 cursor-pointer transition">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full border border-purple-500 flex items-center justify-center text-purple-600 text-2xl font-bold">
                    +
                  </div>
                  <span className="text-sm font-semibold text-black">
                    Click to add image(s)
                  </span>
                  <span className="text-[11px] text-gray-500">
                    You can select multiple files at once.
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, 'client')}
                />
              </label>

              {clientImages.length > 0 && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {clientImages.map((img, index) => (
                    <div
                      key={index}
                      className="relative border border-gray-300 rounded-lg overflow-hidden bg-gray-50"
                    >
                      <img
                        src={img.dataUrl}
                        alt={img.name}
                        className="w-full h-24 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index, 'client')}
                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                      >
                        ✕
                      </button>
                      <div className="p-1">
                        <p className="text-[10px] text-gray-600 truncate">
                          {img.name}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {img.sizeKB} KB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* -------- PAYMENT SELECTION -------- */}
            <div className="mt-6">
              <label className="block text-black mb-2 font-semibold">
                Payment Option
              </label>

              <p className="text-sm text-gray-600 mb-3">
                Choose how you would like to pay.{' '}
                <span className="font-semibold">
                  (eSewa and Bank: for Nepali citizens only)
                </span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                {/* PAYPAL CARD */}
                {hasPaypal && (
                  <button
                    type="button"
                    onClick={() => setPaymentChoice('PAYPAL')}
                    className={`w-full text-left rounded-xl border px-4 py-3 bg-white flex flex-col gap-2 transition ${
                      paymentChoice === 'PAYPAL'
                        ? 'border-blue-500 shadow-[0_0_0_2px_rgba(37,99,235,0.4)]'
                        : 'border-black/20 hover:border-blue-400 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        P
                      </div>
                      <div>
                        <div className="font-semibold text-black">PayPal</div>
                        <div className="text-xs text-gray-500">
                          International Payments
                        </div>
                      </div>
                    </div>

                    {paymentChoice === 'PAYPAL' && activePaypal && (
                      <div className="mt-2 border-t border-gray-200 pt-2 text-xs text-gray-700">
                        {activePaypal.email && (
                          <div className="mb-1">
                            <span className="font-semibold">Email: </span>
                            {activePaypal.email}
                          </div>
                        )}

                        {activePaypal.qrImageUrl && (
                          <div className="mt-1">
                            <span className="font-semibold">QR:</span>
                            <div className="mt-1 w-20 h-20 border border-gray-300 bg-gray-50 rounded-lg overflow-hidden">
                              <img
                                src={activePaypal.qrImageUrl}
                                className="w-full h-full object-contain cursor-pointer"
                                onClick={() =>
                                  setZoomImage(activePaypal.qrImageUrl)
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                )}

                {/* ESEWA */}
                {hasEsewa && (
                  <button
                    type="button"
                    onClick={() => setPaymentChoice('ESEWA')}
                    className={`w-full text-left rounded-xl border px-4 py-3 bg-white flex flex-col gap-2 transition ${
                      paymentChoice === 'ESEWA'
                        ? 'border-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.4)]'
                        : 'border-black/20 hover:border-emerald-400 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                        e
                      </div>
                      <div>
                        <div className="font-semibold text-black">eSewa</div>
                        <div className="text-xs text-gray-500">
                          Nepali Citizen Only
                        </div>
                      </div>
                    </div>

                    {paymentChoice === 'ESEWA' && activeEsewa && (
                      <div className="mt-2 border-t border-gray-200 pt-2 text-xs text-gray-700">
                        {activeEsewa.esewaId && (
                          <div className="mb-1">
                            <span className="font-semibold">eSewa ID: </span>
                            {activeEsewa.esewaId}
                          </div>
                        )}

                        {activeEsewa.esewaName && (
                          <div className="mb-1">
                            <span className="font-semibold">Name: </span>
                            {activeEsewa.esewaName}
                          </div>
                        )}

                        {activeEsewa.qrImageUrl && (
                          <div className="mt-1">
                            <span className="font-semibold">QR:</span>
                            <div className="mt-1 w-20 h-20 border border-gray-300 bg-gray-50 rounded-lg overflow-hidden">
                              <img
                                src={activeEsewa.qrImageUrl}
                                className="w-full h-full object-contain cursor-pointer"
                                onClick={() =>
                                  setZoomImage(activeEsewa.qrImageUrl)
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                )}

                {/* BANK */}
                {hasBank && (
                  <button
                    type="button"
                    onClick={() => setPaymentChoice('BANK')}
                    className={`w-full text-left rounded-xl border px-4 py-3 bg-white flex flex-col gap-2 transition ${
                      paymentChoice === 'BANK'
                        ? 'border-yellow-500 shadow-[0_0_0_2px_rgba(234,179,8,0.45)]'
                        : 'border-black/20 hover:border-yellow-400 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-black font-bold text-sm">
                        $
                      </div>
                      <div>
                        <div className="font-semibold text-black">Bank</div>
                        <div className="text-xs text-gray-500">
                          Nepali Citizen Only
                        </div>
                      </div>
                    </div>

                    {paymentChoice === 'BANK' && activeBank && (
                      <div className="mt-2 border-t border-gray-200 pt-2 text-xs text-gray-700">
                        {activeBank.bankName && (
                          <div className="mb-1">
                            <span className="font-semibold">Bank: </span>
                            {activeBank.bankName}
                          </div>
                        )}

                        {activeBank.bankAccountName && (
                          <div className="mb-1">
                            <span className="font-semibold">
                              Account Holder:{' '}
                            </span>
                            {activeBank.bankAccountName}
                          </div>
                        )}

                        {activeBank.bankAccountNumber && (
                          <div className="mb-1">
                            <span className="font-semibold">
                              Account Number:{' '}
                            </span>
                            {activeBank.bankAccountNumber}
                          </div>
                        )}

                        {activeBank.qrImageUrl && (
                          <div className="mt-1">
                            <span className="font-semibold">QR:</span>
                            <div className="mt-1 w-20 h-20 border border-gray-300 bg-gray-50 rounded-lg overflow-hidden">
                              <img
                                src={activeBank.qrImageUrl}
                                className="w-full h-full object-contain cursor-pointer"
                                onClick={() =>
                                  setZoomImage(activeBank.qrImageUrl)
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                )}
              </div>

              {/* If none available */}
              {!hasPaypal && !hasEsewa && !hasBank && (
                <p className="text-sm text-red-600 font-semibold mt-1">
                  No payment methods are currently available. Please contact
                  admin.
                </p>
              )}
            </div>

            {/* -------- PAYMENT PROOF UPLOAD -------- */}
            <div className="mt-4">
              <label className="block text-black mb-2 font-semibold">
                Upload Payment Proof (Required)
              </label>
              <p className="text-xs text-gray-600 mb-2">
                After sending the payment, please upload a clear screenshot or
                photo of your payment confirmation / receipt.
              </p>

              <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-xl px-4 py-6 bg-white hover:border-green-500 cursor-pointer transition">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full border border-green-500 flex items-center justify-center text-green-600 text-2xl font-bold">
                    +
                  </div>
                  <span className="text-sm font-semibold text-black">
                    Click to add payment proof image(s)
                  </span>
                  <span className="text-[11px] text-gray-500">
                    You can upload more than one if needed.
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, 'paymentProof')}
                />
              </label>

              {paymentProofImages.length > 0 && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {paymentProofImages.map((img, index) => (
                    <div
                      key={index}
                      className="relative border border-gray-300 rounded-lg overflow-hidden bg-gray-50"
                    >
                      <img
                        src={img.dataUrl}
                        alt={img.name}
                        className="w-full h-24 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index, 'paymentProof')}
                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                      >
                        ✕
                      </button>
                      <div className="p-1">
                        <p className="text-[10px] text-gray-600 truncate">
                          {img.name}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {img.sizeKB} KB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BUTTONS */}
            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-yellow-400 to-pink-500 text-black font-bold py-3 rounded-lg hover:scale-105 transition"
              >
                Submit Booking
              </button>

              <button
                type="button"
                onClick={() => setShowExitModal(true)}
                className="flex-1 bg-gray-600 text-white font-bold py-3 rounded-lg hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* QR ZOOM POPUP */}
      {zoomImage && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-[99999]"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="relative bg-white rounded-2xl p-4 shadow-2xl w-[90%] max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomImage}
              className="w-full h-auto rounded-lg object-contain"
            />

            <a
              href={zoomImage}
              download="qr-code.jpg"
              className="mt-4 block w-full text-center bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Download Image
            </a>

            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 w-full max-w-md text-white">
            <h2 className="text-3xl font-bold text-yellow-300 mb-3 text-center">
              Booking Successful!
            </h2>
            <p className="text-gray-200 text-center mb-6">
              Thank you! Your booking has been submitted. I will contact you
              soon 🙏
            </p>

            <div className="flex justify-center">
              <button
                onClick={() => navigate('/', { replace: true })}
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-pink-500 text-black font-bold rounded-lg hover:scale-105 transition active:scale-95"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXIT MODAL */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-[#0f172a]/90 backdrop-blur-[2px] border border-white/10 p-6 rounded-2xl shadow-2xl w-full max-w-md text-white">
              <h2 className="text-2xl font-bold mb-4">Leave Booking?</h2>
              <p className="text-gray-300 mb-6">
                If you exit now, all entered information will be lost.
              </p>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowExitModal(false)}
                  className="bg-gray-600 hover:bg-gray-500 text-white font-semibold px-5 py-2 rounded-lg"
                >
                  Stay
                </button>

                <button
                  onClick={() => {
                    setShowExitModal(false)
                    navigate('/', { replace: true })
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-lg"
                >
                  Exit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
