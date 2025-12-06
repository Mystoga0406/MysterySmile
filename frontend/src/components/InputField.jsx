/* ========================= src/components/InputField.jsx ========================= */
import React from 'react'

export default function InputField({ label, name, type = "text", value, onChange, required, placeholder }) {
  return (
    <div>
      <label className="block text-black mb-2">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder} // <- this sets grey instruction
        className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 text-black placeholder-gray-400 focus:outline-black focus:ring-2 focus:ring-yellow-300"
      />
    </div>
  )
}
