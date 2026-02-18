"use client";

import { ChevronDown, Phone, X } from "lucide-react";
import { formatPrice, formatTime } from "@/lib/utils";
import { Button } from "./ui/button";

interface FutsalBooking {
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
}

interface FutsalBookingCardProps {
  booking: FutsalBooking;
  isExpanded: boolean;
  onToggle: () => void;
  onCancel: (booking: FutsalBooking) => void;
}

export default function FutsalBookingCard({
  booking,
  isExpanded,
  onToggle,
  onCancel,
}: FutsalBookingCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Card Header */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {booking.customerName}
              </h3>
            </div>

            <p className="text-sm text-gray-600 mt-1">{booking.ground.name}</p>

            <p className="text-sm font-medium text-primary-600 mt-1">
              {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
            </p>

            <span className="text-xs text-gray-500">
              {new Date(booking.date).toLocaleDateString("en-LK")}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={`px-4 py-2 text-xs rounded-full ${
                booking.status === "CANCELLED" || booking.status === "cancelled"
                  ? "bg-red-100 text-red-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {booking.status === "CANCELLED" || booking.status === "cancelled"
                ? "Cancelled"
                : "Booked"}
            </span>

            <ChevronDown className="h-5 w-5 text-gray-500" />
          </div>
        </div>

        {/* Action Buttons - Collapsed View */}
        {!isExpanded && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            {booking.status === "CANCELLED" ||
            booking.status === "cancelled" ? (
              <span className="text-gray-400 text-sm px-3 py-2 bg-gray-100 rounded-md flex-1 text-center">
                Cancelled
              </span>
            ) : (
              <Button
                variant={"destructive"}
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(booking);
                }}
                className="flex-1"
                // className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 flex items-center justify-center gap-1 text-sm font-medium px-3 py-2 rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            )}

            <Button variant={"outline"} asChild className="flex-1">
              <a
                href={`tel:${booking.customerPhone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-1"
              >
                <Phone className="h-4 w-4" /> Call Customer
              </a>
            </Button>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Ground:</span>
                <p className="font-medium text-gray-900">
                  {booking.ground.name}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Price:</span>
                <p className="font-medium text-gray-900">
                  {formatPrice(booking.price)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Phone:</span>
                <p className="font-medium text-gray-900">
                  {booking.customerPhone}
                </p>
              </div>
            </div>

            {booking.reason && (
              <div>
                <span className="text-gray-500 text-sm">Reason:</span>
                <p className="text-sm text-gray-900 mt-1">{booking.reason}</p>
              </div>
            )}

            {booking.cancellationReason &&
              booking.cancellationReason !== "undefined" &&
              booking.cancellationReason.trim() !== "" && (
                <div>
                  <span className="text-gray-500 text-sm">
                    Cancellation Reason:
                  </span>
                  <p className="text-sm text-gray-900 mt-1">
                    {booking.cancellationReason}
                  </p>
                </div>
              )}

            <div className="flex items-center gap-2 pt-2">
              {booking.status === "CANCELLED" ||
              booking.status === "cancelled" ? (
                <span className="text-gray-400 text-sm px-3 py-2 bg-gray-100 rounded-md flex-1 text-center">
                  Cancelled
                </span>
              ) : (
                <Button
                  variant={"destructive"}
                  onClick={() => onCancel(booking)}
                  className="flex-1"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              )}
              <Button
                asChild
                className="flex-1 bg-sky-50 text-sky-800 hover:bg-sky-100 border-sky-200"
              >
                <a
                  href={`tel:${booking.customerPhone}`}
                  className="flex items-center justify-center gap-1"
                >
                  <Phone className="h-4 w-4" /> Call Customer
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
