"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Clock, User, Phone, Users } from "lucide-react";
import toast from "react-hot-toast";

interface Shift {
  startTime: string;
  endTime: string;
  maxCapacity: number;
  price: number;
}

interface SwimmingPoolBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  ground: {
    id: string;
    name: string;
    shifts?: Shift[];
  };
  onBookingSuccess?: () => void;
}

export default function SwimmingPoolBookingModal({
  isOpen,
  onClose,
  ground,
  onBookingSuccess,
}: SwimmingPoolBookingModalProps) {
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    numberOfPeople: 1,
    isOccassion: false,
  });
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [selectedShift, setSelectedShift] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    if (ground.shifts) {
      setShifts(ground.shifts);
    }
  }, [ground.shifts]);

  if (!isOpen) return null;

  const selectedShiftData = shifts.find(
    (s) => `${s.startTime}-${s.endTime}` === selectedShift,
  );

  const totalPrice = selectedShiftData
    ? selectedShiftData.price * formData.numberOfPeople
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    if (!selectedShift) {
      toast.error("Please select a shift");
      return;
    }

    if (!formData.customerName.trim()) {
      toast.error("Please enter customer name");
      return;
    }

    if (!formData.customerPhone.trim()) {
      toast.error("Please enter customer phone");
      return;
    }

    if (formData.numberOfPeople < 1) {
      toast.error("Number of people must be at least 1");
      return;
    }

    if (
      selectedShiftData &&
      formData.numberOfPeople > selectedShiftData.maxCapacity
    ) {
      toast.error(
        `Maximum capacity for this shift is ${selectedShiftData.maxCapacity}`,
      );
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/bookings/pool", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          groundId: ground.id,
          date: selectedDate,
          shift: selectedShift,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          numberOfPeople: formData.numberOfPeople,
          isOccassion: formData.isOccassion,
          totalPrice,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Swimming pool booking created successfully!");
        setFormData({
          customerName: "",
          customerPhone: "",
          numberOfPeople: 1,
          isOccassion: false,
        });
        setSelectedShift("");
        if (onBookingSuccess) {
          onBookingSuccess();
        }
      } else {
        toast.error(data.error || "Failed to create booking");
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to create booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Swimming Pool Booking
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Ground Name */}
          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
            <p className="text-sm text-cyan-700 font-medium">{ground.name}</p>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Shift Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="inline h-4 w-4 mr-1" />
              Select Shift
            </label>
            {shifts.length > 0 ? (
              <div className="space-y-2">
                {shifts.map((shift, index) => (
                  <label
                    key={index}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedShift === `${shift.startTime}-${shift.endTime}`
                        ? "border-cyan-500 bg-cyan-50"
                        : "border-gray-200 hover:border-cyan-300"
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="shift"
                        value={`${shift.startTime}-${shift.endTime}`}
                        checked={
                          selectedShift ===
                          `${shift.startTime}-${shift.endTime}`
                        }
                        onChange={(e) => setSelectedShift(e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {shift.startTime} - {shift.endTime}
                        </p>
                        <p className="text-sm text-gray-500">
                          Max: {shift.maxCapacity} people
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-cyan-600">
                      Rs. {shift.price.toLocaleString()}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No shifts configured for this pool
              </p>
            )}
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Customer Name
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) =>
                setFormData({ ...formData, customerName: e.target.value })
              }
              placeholder="Enter customer name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Customer Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="inline h-4 w-4 mr-1" />
              Customer Phone
            </label>
            <input
              type="tel"
              value={formData.customerPhone}
              onChange={(e) =>
                setFormData({ ...formData, customerPhone: e.target.value })
              }
              placeholder="07X XXX XXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Function/Event Checkbox */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="isOccassion"
                type="checkbox"
                checked={formData.isOccassion}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isOccassion: e.target.checked,
                  })
                }
                className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
              />
            </div>
            <label htmlFor="isOccassion" className="ml-3 text-sm">
              <span className="font-medium text-gray-700">
                Is this for a function/event?
              </span>
              <p className="text-gray-500">
                (e.g., Wedding, Birthday party, Corporate event)
              </p>
            </label>
          </div>

          {/* Number of People */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="inline h-4 w-4 mr-1" />
              Number of People
            </label>
            <input
              type="number"
              value={formData.numberOfPeople}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  numberOfPeople: parseInt(e.target.value) || 1,
                })
              }
              min={1}
              max={
                formData.isOccassion
                  ? 9999
                  : selectedShiftData?.maxCapacity || 100
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {selectedShiftData && !formData.isOccassion && (
              <p className="text-xs text-gray-500 mt-1">
                Maximum: {selectedShiftData.maxCapacity} people
              </p>
            )}
            {formData.isOccassion && (
              <p className="text-xs text-cyan-600 mt-1">
                No limit for functions/events
              </p>
            )}
          </div>

          {/* Price Summary */}
          {selectedShiftData && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  {formData.numberOfPeople} x Rs.{" "}
                  {selectedShiftData.price.toLocaleString()}
                </span>
                <span className="text-xl font-bold text-gray-900">
                  Rs. {totalPrice.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedShift}
              className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
