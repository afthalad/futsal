"use client";

import { useState } from "react";
import FutsalBookingCard from "./FutsalBookingCard";
import SwimmingPoolBookingCard from "./SwimmingPoolBookingCard";

interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  cancellationReason?: string;
  ground: {
    name: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status: string;
  reason?: string;
  type?: string;
  poolStatus?: string;
  numberOfPeople?: number;
  shift?: string;
  isOccassion?: boolean;
}

interface ResponsiveTableProps {
  bookings: Booking[];
  onCancelBooking: (booking: Booking) => void;
  onStatusUpdate?: () => void;
}

const isToday = (date: string) => {
  const today = new Date().toDateString();
  const bookingDate = new Date(date).toDateString();
  return today === bookingDate;
};

export default function ResponsiveTable({
  bookings,
  onCancelBooking,
  onStatusUpdate,
}: ResponsiveTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (bookingId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(bookingId)) {
      newExpanded.delete(bookingId);
    } else {
      newExpanded.add(bookingId);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="space-y-3">
      {bookings.map((booking) => {
        const isExpanded = expandedRows.has(booking.id);

        if (booking.type === "swimmingpool") {
          return (
            <SwimmingPoolBookingCard
              key={booking.id}
              booking={booking}
              isExpanded={isExpanded}
              onToggle={() => toggleRow(booking.id)}
              onCancel={onCancelBooking}
              onStatusUpdate={onStatusUpdate}
            />
          );
        }

        // Default to futsal booking card
        return (
          <FutsalBookingCard
            key={booking.id}
            booking={booking}
            isExpanded={isExpanded}
            onToggle={() => toggleRow(booking.id)}
            onCancel={onCancelBooking}
          />
        );
      })}
    </div>
  );
}
