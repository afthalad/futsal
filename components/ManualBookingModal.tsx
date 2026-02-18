"use client";

import { useState, FormEvent } from "react";
import { X, Calendar, Clock, User, Phone, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { formatPrice, formatTime } from "@/lib/utils";

interface ManualBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  grounds: Array<{
    id: string;
    name: string;
    type?: string;
    morningPrice: number;
    eveningPrice: number;
    nightPrice: number;
    shifts?: Array<{
      startTime: string;
      endTime: string;
      maxCapacity: number;
      price: number;
    }>;
  }>;
  onBookingSuccess?: () => void;
}

export default function ManualBookingModal({
  isOpen,
  onClose,
  grounds,
  onBookingSuccess,
}: ManualBookingModalProps) {
  const [selectedGround, setSelectedGround] = useState<string>("");
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
    numberOfPeople: 1,
    selectedShift: "",
    isOccassion: false,
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const selectedGroundData = grounds.find((g) => g.id === selectedGround);
  const isSwimmingPool = selectedGroundData?.type === "swimmingpool";

  // Generate time slots for futsal (6 AM to midnight)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour < 24; hour++) {
      slots.push(`${String(hour).padStart(2, "0")}:00`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Calculate price for futsal
  const getFutsalPrice = () => {
    if (!selectedGroundData || !formData.startTime) return 0;
    const hour = parseInt(formData.startTime.split(":")[0]);
    if (hour >= 6 && hour < 12) return selectedGroundData.morningPrice;
    if (hour >= 12 && hour < 18) return selectedGroundData.eveningPrice;
    return selectedGroundData.nightPrice;
  };

  const selectedShiftData = selectedGroundData?.shifts?.find(
    (s) => `${s.startTime}-${s.endTime}` === formData.selectedShift,
  );

  const totalPrice = isSwimmingPool
    ? selectedShiftData?.price || 0
    : getFutsalPrice();

  const handleGroundChange = (groundId: string) => {
    setSelectedGround(groundId);
    setFormData({
      customerName: "",
      customerPhone: "",
      date: new Date().toISOString().split("T")[0],
      startTime: "",
      endTime: "",
      numberOfPeople: 1,
      selectedShift: "",
      isOccassion: false,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedGround) {
      toast.error("Please select a ground");
      return;
    }

    if (!formData.customerName.trim() || !formData.customerPhone.trim()) {
      toast.error("Please fill in customer details");
      return;
    }

    if (isSwimmingPool) {
      if (!formData.selectedShift) {
        toast.error("Please select a shift");
        return;
      }
      if (formData.numberOfPeople < 1) {
        toast.error("Number of people must be at least 1");
        return;
      }
      if (totalPrice <= 0) {
        toast.error("Invalid price. Please select a shift.");
        return;
      }
    } else {
      if (!formData.startTime || !formData.endTime) {
        toast.error("Please select start and end time");
        return;
      }
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const endpoint = isSwimmingPool ? "/api/bookings/pool" : "/api/bookings";

      const payload = isSwimmingPool
        ? {
            groundId: selectedGround,
            date: formData.date,
            shift: formData.selectedShift,
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            numberOfPeople: formData.numberOfPeople,
            isOccassion: formData.isOccassion,
            totalPrice: totalPrice,
            isOwner: true,
          }
        : {
            groundId: selectedGround,
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
            isOwner: true,
            price: totalPrice,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `${isSwimmingPool ? "Swimming pool" : "Futsal"} booking created successfully!`,
        );
        setFormData({
          customerName: "",
          customerPhone: "",
          date: new Date().toISOString().split("T")[0],
          startTime: "",
          endTime: "",
          numberOfPeople: 1,
          selectedShift: "",
          isOccassion: false,
        });
        setSelectedGround("");
        if (onBookingSuccess) {
          onBookingSuccess();
        }
        onClose();
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
            Create Manual Booking
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
          {/* Ground Selection - Always visible */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Ground
            </label>
            <div className="relative">
              <select
                value={selectedGround}
                onChange={(e) => handleGroundChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8"
              >
                <option value="">-- Select a ground --</option>
                {grounds.map((ground) => (
                  <option key={ground.id} value={ground.id}>
                    {ground.name} {ground.type === "swimmingpool" ? "🏊" : "⚽"}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Show form fields only when ground is selected */}
          {selectedGround && selectedGroundData && (
            <>
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Conditional fields based on ground type */}
              {isSwimmingPool ? (
                <>
                  {/* Shift Selection for Swimming Pool */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="inline h-4 w-4 mr-1" />
                      Select Shift
                    </label>
                    {selectedGroundData.shifts &&
                    selectedGroundData.shifts.length > 0 ? (
                      <div className="space-y-2">
                        {selectedGroundData.shifts.map((shift, index) => (
                          <label
                            key={index}
                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                              formData.selectedShift ===
                              `${shift.startTime}-${shift.endTime}`
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
                                  formData.selectedShift ===
                                  `${shift.startTime}-${shift.endTime}`
                                }
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    selectedShift: e.target.value,
                                  })
                                }
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
                        No shifts configured
                      </p>
                    )}
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
                        Is this for a occasion?
                      </span>
                      <p className="text-gray-500">
                        (e.g: Wedding, Party, Office event)
                      </p>
                    </label>
                  </div>

                  {/* Number of People */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="inline h-4 w-4 mr-1" />
                      Number of People
                    </label>
                    <input
                      type="number"
                      value={formData.numberOfPeople}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          numberOfPeople: parseInt(e.target.value),
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
                        No limit for occasions/functions
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Time Selection for Futsal */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="inline h-4 w-4 mr-1" />
                        Start Time
                      </label>
                      <select
                        value={formData.startTime}
                        onChange={(e) => {
                          const startHour = parseInt(
                            e.target.value.split(":")[0],
                          );
                          const endTime = `${String(startHour + 1).padStart(2, "0")}:00`;
                          setFormData({
                            ...formData,
                            startTime: e.target.value,
                            endTime: endTime,
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select</option>
                        {timeSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {formatTime(slot)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time
                      </label>
                      <input
                        type="text"
                        value={
                          formData.endTime ? formatTime(formData.endTime) : ""
                        }
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        placeholder="Auto"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Customer Details */}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Create Booking"}
                </button>
              </div>
            </>
          )}

          {!selectedGround && (
            <p className="text-center text-gray-500 py-8">
              Select a ground to continue
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
