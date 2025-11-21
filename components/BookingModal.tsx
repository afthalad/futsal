"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { X, Calendar, Clock, User, Phone } from "lucide-react";
import {
  formatPrice,
  formatTime,
  isMorningSlot,
  isEveningSlot,
  isNightSlot,
} from "@/lib/utils";
import toast from "react-hot-toast";
import AdBanner from "./AdBanner";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  ground: {
    id: string;
    name: string;
    morningPrice: number;
    eveningPrice: number;
    nightPrice: number;
    ownerPhone?: string;
  };
  selectedDate: string;
  selectedTime: string;
  selectedEndTime: string;
  onBookingSuccess?: () => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  ground,
  selectedDate,
  selectedTime,
  selectedEndTime,
  onBookingSuccess,
}: BookingModalProps) {
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
  });
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otpId, setOtpId] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const resendIntervalRef = useRef<number | null>(null);

  const startResendTimer = (seconds = 60) => {
    setResendCooldown(seconds);
    if (resendIntervalRef.current) {
      window.clearInterval(resendIntervalRef.current);
      resendIntervalRef.current = null;
    }
    resendIntervalRef.current = window.setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (resendIntervalRef.current) {
            window.clearInterval(resendIntervalRef.current);
            resendIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;
  };

  // cleanup resend timer on unmount
  useEffect(() => {
    return () => {
      if (resendIntervalRef.current) {
        window.clearInterval(resendIntervalRef.current);
        resendIntervalRef.current = null;
      }
    };
  }, []);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      setOtpLoading(true);
      const res = await fetch("/api/book-send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groundId: ground.id,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          date: selectedDate,
          startTime: selectedTime,
          endTime: selectedEndTime,
          price,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to resend OTP");
        return;
      }
      setOtpSent(true);
      setOtpId(data.otpId || null);
      startResendTimer(60);
      toast.success("OTP resent! please check your SMS");
    } catch (err) {
      console.error("Resend OTP error:", err);
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Prefill from localStorage when modal opens
  useEffect(() => {
    if (!isOpen) return;
    try {
      const savedName = localStorage.getItem("lastBookingName");
      const savedPhone = localStorage.getItem("lastBookingPhone");
      setFormData((prev) => ({
        customerName: savedName || prev.customerName,
        customerPhone: savedPhone || prev.customerPhone,
      }));
    } catch (e) {
      // ignore localStorage errors
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const price = isMorningSlot(selectedTime)
    ? ground.morningPrice
    : isEveningSlot(selectedTime)
    ? ground.eveningPrice
    : ground.nightPrice;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.customerName.trim() || !formData.customerPhone.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    // Validate Sri Lankan phone number (accepts 0 or 94 prefix)
    const phoneRegex = /^(0|94)[0-9]{9}$/;
    if (!phoneRegex.test(formData.customerPhone)) {
      toast.error(
        "Please enter a valid Sri Lankan phone number (e.g., 0773078103 or 94773078103)"
      );
      return;
    }

    // If OTP not yet sent, request OTP and show OTP input
    if (!otpSent) {
      try {
        setOtpLoading(true);
        const res = await fetch("/api/book-send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groundId: ground.id,
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            date: selectedDate,
            startTime: selectedTime,
            endTime: selectedEndTime,
            price,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to send OTP");
          return;
        }
        setOtpSent(true);
        setOtpId(data.otpId || null);
        // start resend cooldown
        startResendTimer(60);
        toast.success("OTP sent! please check your SMS");
      } catch (err) {
        console.error("Send OTP error:", err);
        toast.error("Failed to send OTP. Please try again.");
      } finally {
        setOtpLoading(false);
      }
      return;
    }

    // If OTP sent, verify it first then submit booking
    if (otpSent) {
      if (!otpInput.trim()) {
        setOtpError("Please enter the verification code");
        return;
      }

      setLoading(true);
      setOtpError(null);
      try {
        const verifyRes = await fetch("/api/booking-verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otpId, otp: otpInput }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) {
          setOtpError(verifyData.error || "OTP incorrect");
          setLoading(false);
          return;
        }

        // OTP verified — proceed to create booking
        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            groundId: ground.id,
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            date: selectedDate,
            startTime: selectedTime,
            endTime: selectedEndTime,
            price,
          }),
        });

        const data = await response.json();

        if (response.status === 403) {
          // setShowSuccessAd(false);
          setBookingSuccess(false);
          setLoading(false);
          return;
        }

        if (response.ok) {
          // persist contact for next time
          try {
            localStorage.setItem("lastBookingName", formData.customerName);
            localStorage.setItem("lastBookingPhone", formData.customerPhone);
          } catch (e) {
            // ignore storage errors
          }

          // clear resend timer if any
          if (resendIntervalRef.current) {
            window.clearInterval(resendIntervalRef.current);
            resendIntervalRef.current = null;
          }
          setResendCooldown(0);

          toast.success("Booking confirmed!", { duration: 1000 });
          setBookingSuccess(true);
          // setShowSuccessAd(true);

          setTimeout(() => {
            setTimeout(() => {
              onClose();
              setFormData({ customerName: "", customerPhone: "" });
              setOtpSent(false);
              setOtpId(null);
              setOtpInput("");
              setBookingSuccess(false);
              if (onBookingSuccess) onBookingSuccess();
            }, 500);
          }, 5000);
        } else {
          toast.error(data.error || "Failed to submit booking");
        }
      } catch (error) {
        console.error("Booking error:", error);
        toast.error("Failed to submit booking. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4"
      onClick={loading ? undefined : onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-sm sm:max-w-md w-full max-h-[95vh] sm:max-h-[100vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6">
          <>
            {/* ...existing code for bookingSuccess and booking form... */}
            {bookingSuccess ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-green-600">
                    Booking Confirmed!
                  </h2>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
                <div className="text-left mb-6">
                  <p className="text-sm text-gray-600">
                    Your booking for <strong>{ground.name}</strong> has been
                    confirmed. Please be on time for your booking.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    Book Ground
                  </h2>
                  <button
                    onClick={onClose}
                    disabled={loading}
                    className="text-gray-400 hover:text-gray-600 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    {ground.name}
                  </h3>
                  <div className="space-y-2 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                      <span>
                        {new Date(selectedDate).toLocaleDateString("en-LK", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                      <span>
                        {formatTime(selectedTime)} -{" "}
                        {formatTime(selectedEndTime)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-base sm:text-lg text-primary-600">
                        {formatPrice(price)}
                      </span>
                    </div>
                  </div>
                </div>
                <form
                  onSubmit={handleSubmit}
                  className="space-y-3 sm:space-y-4"
                >
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customerName: e.target.value,
                        })
                      }
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customerPhone: e.target.value,
                        })
                      }
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
                      placeholder="Enter your phone number (e.g., 0773078103)"
                      required
                    />
                    {/* <p className="text-xs text-gray-500 mt-1">
                      // Enter your phone number (10 digits starting with 0)
                    </p> */}
                  </div>
                  {otpSent && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
                        placeholder="Enter the OTP you received"
                      />
                      {otpError && (
                        <p className="text-xs text-red-600 mt-1">{otpError}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">
                          {resendCooldown > 0
                            ? `Resend available in`
                            : "Didn't receive the code?"}
                        </p>
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={resendCooldown > 0 || otpLoading}
                          className="text-sm text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resendCooldown > 0
                            ? `Resend (${resendCooldown}s)`
                            : "Resend OTP"}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-3 sm:pt-4">
                    <button
                      type="submit"
                      className="w-full sm:flex-1 px-4 py-2 sm:py-3 bg-primary-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading || otpLoading}
                    >
                      {otpLoading
                        ? "Sending OTP..."
                        : loading
                        ? "Processing..."
                        : !otpSent
                        ? "Send OTP to Book"
                        : "Verify & Book"}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full sm:flex-1 px-4 py-2 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            )}
          </>
        </div>
      </div>
    </div>
  );
}
