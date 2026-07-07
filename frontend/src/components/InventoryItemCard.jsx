import React from 'react';

const InventoryItemCard = ({ item }) => {
  if (!item) return null; // Prevent crashing on undefined

  return (
    <div className="border rounded-lg shadow-md p-4 bg-white">
      <h2 className="text-lg font-semibold">{item.name}</h2>
      <p>Quantity: {item.quantity}</p>
      <p>Location: {item.location}</p>
    </div>
  );
};

export default InventoryItemCard;
