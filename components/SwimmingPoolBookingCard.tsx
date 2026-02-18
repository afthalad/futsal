"use client";

import { Phone, X } from "lucide-react";
import { formatPrice, formatTime } from "@/lib/utils";
import { Button } from "./ui/button";
import toast from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface SwimmingPoolBooking {
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
  poolStatus?: string;
  numberOfPeople?: number;
  shift?: string;
  isOccassion?: boolean;
}

interface SwimmingPoolBookingCardProps {
  booking: SwimmingPoolBooking;
  isExpanded: boolean;
  onToggle: () => void;
  onCancel: (booking: SwimmingPoolBooking) => void;
  onStatusUpdate?: () => void;
}

export default function SwimmingPoolBookingCard({
  booking,
  isExpanded,
  onToggle,
  onCancel,
  onStatusUpdate,
}: SwimmingPoolBookingCardProps) {
  // Debug log
  console.log("Booking data:", {
    id: booking.id,
    isOccassion: booking.isOccassion,
    customerName: booking.customerName,
  });

  const handleStatusChange = async (newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/bookings/${booking.id}/pool-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success("Status updated successfully");
        if (onStatusUpdate) {
          onStatusUpdate();
        }
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="bg-white border border-cyan-200 rounded-lg shadow-sm">
      {/* Card Header */}
      <div
        className="p-4 cursor-pointer hover:bg-cyan-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {booking.customerName}
              </h3>
            </div>

            <p className="text-sm text-gray-600 mt-1">{booking.ground.name}</p>

            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm font-medium text-cyan-600">
                {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
              </p>
            </div>

            <span className="text-xs text-gray-500">
              {new Date(booking.date).toLocaleDateString("en-LK")}
            </span>
          </div>
        </div>

        {/* Action Buttons - Collapsed View */}
        {!isExpanded && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-cyan-100">
            {booking.status === "CANCELLED" ||
            booking.status === "cancelled" ? (
              <span className="text-gray-400 text-sm px-3 py-2 bg-gray-100 rounded-md flex-1 text-center">
                Cancelled
              </span>
            ) : (
              <>
                {/* <select
                  value={booking.poolStatus || "WAITING_ADVANCE"}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleStatusChange(e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={`px-2 py-2 text-xs rounded-md border font-medium cursor-pointer ${
                    booking.poolStatus === "CONFIRMED"
                      ? "bg-green-100 text-green-800 border-green-300"
                      : booking.poolStatus === "WAITING_ADVANCE"
                        ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                        : "bg-blue-100 text-blue-800 border-blue-300"
                  }`}
                >
                  <option value="WAITING_ADVANCE">Waiting Advance</option>
                  <option value="ADVANCE_PAID">Advance Paid</option>
                  <option value="CONFIRMED">Confirmed</option>
                </select> */}
                <Button
                  variant={"destructive"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel(booking);
                  }}
                  className="flex-1"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button variant={"outline"} asChild className="flex-1">
                  <a
                    href={`tel:${booking.customerPhone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center gap-1"
                  >
                    <Phone className="h-4 w-4" /> Call Customer
                  </a>
                </Button>
              </>
            )}
            {!(
              booking.status === "CANCELLED" || booking.status === "cancelled"
            ) && (
              <Select
                value={booking.poolStatus || "WAITING_ADVANCE"}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger
                  className={
                    booking.poolStatus === "CONFIRMED"
                      ? "bg-green-100 text-green-800 border-none"
                      : booking.poolStatus === "WAITING_ADVANCE"
                        ? "bg-yellow-100 text-yellow-800 border-none text-center"
                        : "bg-blue-100 text-blue-800"
                  }
                >
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="WAITING_ADVANCE">
                      Waiting Advance
                    </SelectItem>

                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-cyan-100 bg-cyan-50/30">
          <div className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Ground:</span>
                <p className="font-medium text-gray-900">
                  {booking.ground.name}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Total Price:</span>
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
              {booking.numberOfPeople && (
                <div>
                  <span className="text-gray-500">People:</span>
                  <p className="font-medium text-gray-900">
                    {booking.numberOfPeople}
                  </p>
                </div>
              )}
              {booking.shift && (
                <div>
                  <span className="text-gray-500">Shift:</span>
                  <p className="font-medium text-gray-900">
                    {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                  </p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Type:</span>
                <p className="font-medium text-gray-900">
                  {booking.isOccassion ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      Occasion
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      Regular
                    </span>
                  )}
                </p>
              </div>
            </div>

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

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {booking.status === "CANCELLED" ||
              booking.status === "cancelled" ? (
                <span className="text-gray-400 text-sm px-3 py-2 bg-gray-100 rounded-md flex-1 text-center">
                  Cancelled
                </span>
              ) : (
                <>
                  <Button
                    variant={"destructive"}
                    onClick={() => onCancel(booking)}
                    className="flex-1"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button variant={"outline"} asChild className="flex-1">
                    <a
                      href={`tel:${booking.customerPhone}`}
                      className="flex items-center justify-center gap-1"
                    >
                      <Phone className="h-4 w-4" /> Call Customer
                    </a>
                  </Button>
                </>
              )}

              {!(
                booking.status === "CANCELLED" || booking.status === "cancelled"
              ) && (
                <Select
                  value={booking.poolStatus || "WAITING_ADVANCE"}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger
                    className={
                      booking.poolStatus === "CONFIRMED"
                        ? "bg-green-100 text-green-800"
                        : booking.poolStatus === "WAITING_ADVANCE"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                    }
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="WAITING_ADVANCE">
                        Waiting Advance
                      </SelectItem>
                      <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// add status as isCommsiosPaid ==false when booking create
