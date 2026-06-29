import React, { useState } from "react";

function InventoryModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: "",
    quantity: 0,
    type: "",
    unit: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">Add New Inventory Item</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="name"
            placeholder="Medicine Name"
            required
            className="w-full p-2 border border-gray-300 rounded"
            onChange={handleChange}
          />
          <input
            name="type"
            placeholder="Type (e.g. Tablet, Injection)"
            className="w-full p-2 border border-gray-300 rounded"
            onChange={handleChange}
          />
          <input
            name="unit"
            placeholder="Unit (e.g. mg, ml)"
            className="w-full p-2 border border-gray-300 rounded"
            onChange={handleChange}
          />
          <input
            name="quantity"
            type="number"
            min="0"
            placeholder="Quantity"
            required
            className="w-full p-2 border border-gray-300 rounded"
            onChange={handleChange}
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InventoryModal;
