import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl);

    newSocket.on('connect', () => {
      console.log('🔌 Connected to Socket.IO server');
      if (user.hospitalId) {
        newSocket.emit('join_hospital', user.hospitalId);
      }
    });

    // Register global listeners for real-time notifications
    newSocket.on('medicine_low_stock', (med) => {
      toast.error(`💊 Low Stock Warning: ${med.name} is below threshold! Remaining: ${med.stockQuantity}`, {
        duration: 5000,
        position: 'top-right'
      });
    });

    newSocket.on('medicine_expired', (med) => {
      toast.error(`⏰ Expiry Alert: ${med.name} (Batch: ${med.batchNumber}) has expired!`, {
        duration: 6000,
        position: 'top-right'
      });
    });

    newSocket.on('token_called', (token) => {
      // Announce token called if user is doctor or receptionist
      toast.success(`🔔 OPD Call: Token #${token.tokenNumber} for ${token.patient.name} called in ${token.department.name}!`, {
        duration: 5000,
        position: 'top-right'
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
