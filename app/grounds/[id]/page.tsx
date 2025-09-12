"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  MapPin,
  Clock,
  Phone,
  Star,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Shield,
  X,
  Mail,
  User,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import BookingModal from "@/components/BookingModal";
import {
  formatPrice,
  formatTime,
  generateTimeSlots,
  isMorningSlot,
} from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from "react-hot-toast";

interface Ground {
  id: string;
  name: string;
  description: string | null;
  location: string;
  city: string;
  phone: string;
  email: string | null;
  images: string[];
  amenities: string[];
  morningPrice: number;
  eveningPrice: number;
  openingTime: string;
  closingTime: string;
  ownerId: string;
  isActive: boolean;
  owner: {
    name: string | null;
    phone: string;
  };
  bookings: {
    date: string;
    startTime: string;
    endTime: string;
    customerName: string;
    customerPhone: string;
    status?: string;
    reason?: string;
    cancellationReason?: string;
    cancelledAt?: any;
    cancelledBy?: string;
  }[];
}

export default function GroundDetailPage() {
  const params = useParams();
  const [ground, setGround] = useState<Ground | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedEndTime, setSelectedEndTime] = useState("");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "time-slots">(
    "calendar"
  );
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    if (params.id) {
      fetchGround();
    }
    checkCurrentUser();
  }, [params.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showImageModal) {
        if (e.key === "Escape") {
          closeImageModal();
        } else if (e.key === "ArrowLeft") {
          prevImage();
        } else if (e.key === "ArrowRight") {
          nextImage();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showImageModal]);

  useEffect(() => {
    // Check ownership after both ground and user are loaded
    if (ground && currentUser && ground.ownerId === currentUser.id) {
      setIsOwner(true);
    }
  }, [ground, currentUser]);

  const checkCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const response = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const user = await response.json();
          setCurrentUser(user);
        }
      }
    } catch (error) {
      console.error("Error checking current user:", error);
    }
  };

  useEffect(() => {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split("T")[0]);
  }, []);

  const fetchGround = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/grounds/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setGround(data.ground);
      } else {
        toast.error("Ground not found");
      }
    } catch (error) {
      console.error("Error fetching ground:", error);
      toast.error("Failed to load ground details");
    } finally {
      setLoading(false);
    }
  };

  const getAvailableTimeSlots = () => {
    if (!ground) return [];

    const slots = generateTimeSlots(ground.openingTime, ground.closingTime, 60);

    // Use local date string to avoid timezone issues
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = String(today.getMonth() + 1).padStart(2, "0");
    const todayDay = String(today.getDate()).padStart(2, "0");
    const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;
    const isToday = selectedDate === todayStr;
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return slots.map((slot) => {
      // Check if slot is in the past (more precise check)
      let isPast = false;
      if (isToday) {
        const [slotHour, slotMinute] = slot.split(":").map(Number);
        const slotTimeInMinutes = slotHour * 60 + slotMinute;
        const currentTimeInMinutes = currentHour * 60 + currentMinute;

        // Consider slot past if current time is past the slot time
        isPast = slotTimeInMinutes <= currentTimeInMinutes;
      }

      // Check if slot is booked
      const booking = ground.bookings.find(
        (booking) => booking.date === selectedDate && booking.startTime === slot
      );

      return {
        time: slot,
        available: !isPast && !booking,
        isPast,
        booking: booking || null,
      };
    });
  };

  const handleTimeSlotClick = (time: string, slot: any) => {
    if (slot.booking) {
      // Show customer info for booked slots
      setSelectedBooking(slot.booking);
      setSelectedTime("");
      setSelectedEndTime("");
    } else if (slot.available && !slot.isPast) {
      // Select available slot and immediately open booking modal
      setSelectedTime(time);
      setSelectedBooking(null);
      // Set end time to 1 hour later
      const [hours, minutes] = time.split(":");
      const endTime = new Date();
      endTime.setHours(parseInt(hours) + 1, parseInt(minutes));
      setSelectedEndTime(endTime.toTimeString().slice(0, 5));

      // Immediately open booking modal for available slots
      if (!isOwner) {
        setShowBookingModal(true);
      }
    }
  };

  const handleBookNow = () => {
    if (!selectedTime) {
      toast.error("Please select a time slot");
      return;
    }

    if (isOwner) {
      toast.error("You cannot book your own ground");
      return;
    }

    // Check if the selected time slot is already booked
    const selectedSlot = availableSlots.find(
      (slot) => slot.time === selectedTime
    );
    if (selectedSlot?.booking) {
      toast.error("This time slot is already booked by another customer");
      return;
    }

    setShowBookingModal(true);
  };

  const handleCancelBooking = (booking: any) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const confirmCancelBooking = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    if (!selectedBooking?.id) {
      toast.error("No booking selected for cancellation");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/bookings/${selectedBooking.id}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: cancelReason,
          }),
        }
      );

      if (response.ok) {
        toast.success(
          "Booking cancelled successfully. Customer will be notified via SMS."
        );
        setShowCancelModal(false);
        setCancelReason("");
        setSelectedBooking(null);
        fetchGround(); // Refresh ground data
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Cancel booking error:", error);
      toast.error("Failed to cancel booking. Please try again.");
    }
  };

  const openImageModal = (index: number) => {
    setCurrentImageIndex(index);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
  };

  const nextImage = () => {
    if (ground?.images && ground.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % ground.images.length);
    }
  };

  const prevImage = () => {
    if (ground?.images && ground.images.length > 0) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + ground.images.length) % ground.images.length
      );
    }
  };

  // Calendar utility functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isDateBooked = (date: Date) => {
    if (!ground) return false;

    // Use local date string to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    // Check if ALL time slots for this date are booked
    const slots = generateTimeSlots(ground.openingTime, ground.closingTime, 60);
    const bookingsForDate = ground.bookings.filter(
      (booking) => booking.date === dateStr
    );

    // If all slots are booked, consider the date fully booked
    return slots.every((slot) =>
      bookingsForDate.some((booking) => booking.startTime === slot)
    );
  };

  const isDatePast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateClick = (date: Date) => {
    if (isDatePast(date) || isDateBooked(date)) return;

    // Use local date string to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    setSelectedDate(dateStr);
    setSelectedTime("");
    setSelectedEndTime("");
    setViewMode("time-slots");
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!ground) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Ground not found</h1>
        </div>
      </div>
    );
  }

  const availableSlots = getAvailableTimeSlots();
  const price = selectedTime
    ? isMorningSlot(selectedTime)
      ? ground.morningPrice
      : ground.eveningPrice
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        

        {/* Mobile Layout: Header -> Slots -> Details */}
        <div className="block xl:hidden space-y-4 sm:space-y-6">
          {/* Booking Section - Mobile First */}
          <Card>
            <CardHeader className="bg-gray-50 border-b border-blue-100">
              <CardTitle className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
                {isOwner ? "Ground Management" : "Book Your Slot"}
              </CardTitle>
            </CardHeader>
            <CardContent className="mt-4">
              <Tabs
                value={viewMode}
                onValueChange={(value) =>
                  setViewMode(value as "calendar" | "time-slots")
                }
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="calendar">Calendar</TabsTrigger>
                  <TabsTrigger value="time-slots">Time Slots</TabsTrigger>
                </TabsList>

                <TabsContent
                  value="calendar"
                  className="space-y-3 sm:space-y-4"
                >
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      {currentMonth.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigateMonth("prev")}
                        className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigateMonth("next")}
                        className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Day headers */}
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day) => (
                        <div
                          key={day}
                          className="p-1.5 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-500"
                        >
                          {day}
                        </div>
                      )
                    )}

                    {/* Calendar days */}
                    {getDaysInMonth(currentMonth).map((date, index) => {
                      if (!date) {
                        return <div key={index} className="p-1.5 sm:p-2"></div>;
                      }

                      const isPast = isDatePast(date);
                      const isBooked = isDateBooked(date);
                      // Use local date string to avoid timezone issues
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      );
                      const day = String(date.getDate()).padStart(2, "0");
                      const dateStr = `${year}-${month}-${day}`;
                      const isSelected = selectedDate === dateStr;
                      const isToday =
                        date.toDateString() === new Date().toDateString();

                      return (
                        <button
                          key={index}
                          onClick={() => handleDateClick(date)}
                          disabled={isPast || isBooked}
                          className={`p-1.5 sm:p-2 text-center text-xs sm:text-sm rounded-lg transition-colors ${
                            isPast
                              ? "text-gray-300 cursor-not-allowed"
                              : isBooked
                              ? "text-red-600 bg-red-50 cursor-not-allowed"
                              : isSelected
                              ? "bg-primary-600 text-white"
                              : isToday
                              ? "bg-primary-100 text-primary-700 hover:bg-primary-200"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>

                
                </TabsContent>

                <TabsContent
                  value="time-slots"
                  className="space-y-3 sm:space-y-4"
                >
                  {selectedDate ? (
                    <>
                      <div className="flex items-center justify-between my-4">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                          Available Time Slots
                        </h3>
                        <button
                          onClick={() => setViewMode("calendar")}
                          className="text-primary-600 hover:text-primary-700 text-xs sm:text-sm"
                        >
                          Change Date
                        </button>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3 max-h-80 sm:max-h-96 overflow-y-auto p-1">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => handleTimeSlotClick(slot.time, slot)}
                            disabled={slot.isPast}
                            className={`time-slot ${
                              slot.isPast
                                ? "past"
                                : slot.booking
                                ? "booked"
                                : selectedTime === slot.time
                                ? "selected"
                                : "available"
                            }`}
                            title={
                              slot.isPast
                                ? "Past time slot"
                                : slot.booking
                                ? `Booked by ${slot.booking.customerName} (${slot.booking.customerPhone})`
                                : "Available for booking"
                            }
                          >
                            <div className="text-xs font-medium">
                              {formatTime(slot.time)}
                            </div>
                            {slot.booking && (
                              <div className="text-xs text-red-600 mt-1 space-y-0.5">
                                <div className="font-medium">Booked</div>
                                <div className="text-gray-600 truncate">
                                  {slot.booking.customerName}
                                </div>
                                <div className="text-gray-500 text-xs">
                                  {slot.booking.customerPhone}
                                </div>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>

                      {availableSlots.filter((slot) => slot.available)
                        .length === 0 && (
                        <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">
                          No available slots for this date
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <Calendar className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                      <p className="text-gray-500 text-sm sm:text-base">
                        Please select a date to view available time slots
                      </p>
                      <button
                        onClick={() => setViewMode("calendar")}
                        className="btn-primary mt-3 sm:mt-4 text-xs sm:text-sm px-4 py-2"
                      >
                        Select Date
                      </button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Selected Booking Info */}
          {selectedBooking && (
            <Card className="mt-4 sm:mt-6 border-red-200 bg-red-50">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-red-800 text-sm sm:text-base">
                      {isOwner
                        ? "Booking Details"
                        : "This Slot is Already Booked"}
                    </h3>
                    <div className="text-red-700 mt-2 text-xs sm:text-sm">
                      <p>
                        <strong>Customer:</strong>{" "}
                        {selectedBooking?.customerName || "N/A"}
                      </p>
                      <p>
                        <strong>Phone:</strong>{" "}
                        {selectedBooking?.customerPhone || "N/A"}
                      </p>
                      <p>
                        <strong>Time:</strong>{" "}
                        {selectedBooking?.startTime && selectedBooking?.endTime
                          ? `${formatTime(
                              selectedBooking.startTime
                            )} - ${formatTime(selectedBooking.endTime)}`
                          : "N/A"}
                      </p>
                      {isOwner && selectedBooking?.reason && (
                        <p>
                          <strong>Reason:</strong> {selectedBooking.reason}
                        </p>
                      )}
                      {!isOwner && (
                        <p className="text-xs text-gray-600 mt-2">
                          This time slot is not available for booking.
                        </p>
                      )}
                    </div>
                    {isOwner && (
                      <div className="mt-3 sm:mt-4">
                        <Button
                          onClick={() =>
                            selectedBooking &&
                            handleCancelBooking(selectedBooking)
                          }
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          Cancel Booking
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => setSelectedBooking(null)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Owner Notice */}
          {isOwner && (
            <Card className="mt-4 sm:mt-6 border-yellow-200 bg-yellow-50">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base">
                      Ground Owner Access
                    </h3>
                    <p className="text-xs sm:text-sm">
                      You are the owner of this ground. You cannot book your own
                      ground.
                    </p>
                    <div className="mt-2">
                      <Button
                        asChild
                        variant="link"
                        size="sm"
                        className="text-yellow-700 hover:text-yellow-800 p-0 h-auto"
                      >
                        <a href="/admin/dashboard">
                          Go to Ground Management Dashboard →
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ground Details Section - Mobile */}
          <Card >
            <CardHeader className="bg-grey-50 border-b border-blue-100">
              <CardTitle className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
                Ground Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                {/* Ground Header */}
                <div className="border-b border-gray-200 pb-4">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                    {ground.name}
                  </h1>
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{ground.location}, {ground.city}</span>
                  </div>
                  
                  {/* Contact Information */}
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-700">{ground.phone}</span>
                    </div>
                    {ground.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-700">{ground.email}</span>
                      </div>
                    )}
                   
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-lg font-bold text-green-600">
                        {formatPrice(ground.morningPrice)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Morning (6 AM - 12 PM)
                      </div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-lg font-bold text-blue-600">
                        {formatPrice(ground.eveningPrice)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Evening (12 PM - 10 PM)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ground Images */}
                <div>
                  <div className="space-y-3">
                    <div
                      className="relative h-40 sm:h-48 rounded-lg overflow-hidden bg-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        ground.images &&
                        ground.images.length > 0 &&
                        openImageModal(currentImageIndex)
                      }
                    >
                      {ground.images && ground.images.length > 0 ? (
                        <Image
                          src={
                            ground.images[currentImageIndex] || ground.images[0]
                          }
                          alt={ground.name}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            console.error("Image load error:", e);
                            e.currentTarget.src = "/placeholder-ground.jpg";
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <div className="text-3xl mb-1">🏟️</div>
                            <p className="text-sm">No images available</p>
                          </div>
                        </div>
                      )}
                      {ground.images && ground.images.length > 0 && (
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 rounded-full p-2">
                            <svg
                              className="w-5 h-5 text-gray-700"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>

                    {ground.images && ground.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-1">
                        {ground.images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setCurrentImageIndex(index);
                              openImageModal(index);
                            }}
                            className={`relative h-12 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity ${
                              currentImageIndex === index
                                ? "ring-2 ring-primary-500"
                                : ""
                            }`}
                          >
                            <Image
                              src={image}
                              alt={`${ground.name} ${index + 1}`}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                console.error("Thumbnail image load error:", e);
                                e.currentTarget.src = "/placeholder-ground.jpg";
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Desktop Layout: Side by Side */}
        <div className="hidden xl:grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
          {/* Ground Details Section */}
          <Card className="xl:col-span-1">
            <CardHeader className="bg-gray-50 border-b border-blue-100">
              <CardTitle className="text-xl font-semibold text-gray-900">Ground Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Ground Header */}
                <div className="border-b border-gray-200 pb-4">
                  <h1 className="text-xl font-bold text-gray-900 mb-2">
                    {ground.name}
                  </h1>
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{ground.location}, {ground.city}</span>
                  </div>
                  
                  {/* Contact Information */}
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-700">{ground.phone}</span>
                    </div>
                    {ground.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-700">{ground.email}</span>
                      </div>
                    )}
                   
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-lg font-bold text-green-600">
                        {formatPrice(ground.morningPrice)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Morning (0 AM - 12 PM)
                      </div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-lg font-bold text-blue-600">
                        {formatPrice(ground.eveningPrice)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Evening (12 PM - 10 PM)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ground Images */}
                <div>
                  <div className="space-y-3">
                    <div
                      className="relative h-40 xl:h-48 rounded-lg overflow-hidden bg-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        ground.images &&
                        ground.images.length > 0 &&
                        openImageModal(currentImageIndex)
                      }
                    >
                      {ground.images && ground.images.length > 0 ? (
                        <Image
                          src={
                            ground.images[currentImageIndex] || ground.images[0]
                          }
                          alt={ground.name}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            console.error("Image load error:", e);
                            e.currentTarget.src = "/placeholder-ground.jpg";
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <div className="text-3xl mb-1">🏟️</div>
                            <p className="text-sm">No images available</p>
                          </div>
                        </div>
                      )}
                      {ground.images && ground.images.length > 0 && (
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 rounded-full p-2">
                            <svg
                              className="w-5 h-5 text-gray-700"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>

                    {ground.images && ground.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-1">
                        {ground.images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setCurrentImageIndex(index);
                              openImageModal(index);
                            }}
                            className={`relative h-12 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity ${
                              currentImageIndex === index
                                ? "ring-2 ring-primary-500"
                                : ""
                            }`}
                          >
                            <Image
                              src={image}
                              alt={`${ground.name} ${index + 1}`}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                console.error("Thumbnail image load error:", e);
                                e.currentTarget.src = "/placeholder-ground.jpg";
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Amenities */}
                {ground.amenities.length > 0 && (
                  <div>
                    <div className="flex flex-wrap gap-1.5">
                      {ground.amenities.map((amenity, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs px-2 py-1"
                        >
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </CardContent>
          </Card>

          {/* Booking Section */}
          <Card className="xl:col-span-2">
            <CardHeader className="bg-gray-50 border-b border-blue-100">
              <CardTitle className="text-xl font-semibold text-gray-900">
                {isOwner ? 'Ground Management' : 'Book Your Slot'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs
                value={viewMode}
                onValueChange={(value) =>
                  setViewMode(value as "calendar" | "time-slots")
                }
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                  <TabsTrigger value="time-slots">Time Slots</TabsTrigger>
                </TabsList>

                <TabsContent value="calendar" className="space-y-4">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {currentMonth.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigateMonth("prev")}
                        className="p-2 rounded-lg hover:bg-gray-100"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigateMonth("next")}
                        className="p-2 rounded-lg hover:bg-gray-100"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Day headers */}
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day) => (
                        <div
                          key={day}
                          className="p-2 text-center text-sm font-medium text-gray-500"
                        >
                          {day}
                        </div>
                      )
                    )}

                    {/* Calendar days */}
                    {getDaysInMonth(currentMonth).map((date, index) => {
                      if (!date) {
                        return <div key={index} className="p-2"></div>;
                      }

                      const isPast = isDatePast(date);
                      const isBooked = isDateBooked(date);
                      // Use local date string to avoid timezone issues
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      );
                      const day = String(date.getDate()).padStart(2, "0");
                      const dateStr = `${year}-${month}-${day}`;
                      const isSelected = selectedDate === dateStr;
                      const isToday =
                        date.toDateString() === new Date().toDateString();

                      return (
                        <button
                          key={index}
                          onClick={() => handleDateClick(date)}
                          disabled={isPast || isBooked}
                          className={`p-2 text-center text-sm rounded-lg transition-colors ${
                            isPast
                              ? "text-gray-300 cursor-not-allowed"
                              : isBooked
                              ? "text-red-600 bg-red-50 cursor-not-allowed"
                              : isSelected
                              ? "bg-primary-600 text-white"
                              : isToday
                              ? "bg-primary-100 text-primary-700 hover:bg-primary-200"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>

                  
                </TabsContent>

                <TabsContent value="time-slots" className="space-y-4">
                  {selectedDate ? (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Available Time Slots
                        </h3>
                        <button
                          onClick={() => setViewMode("calendar")}
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          Change Date
                        </button>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3 max-h-80 sm:max-h-96 lg:max-h-[500px] overflow-y-auto p-1">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => handleTimeSlotClick(slot.time, slot)}
                            disabled={slot.isPast}
                            className={`time-slot ${
                              slot.isPast
                                ? "past"
                                : slot.booking
                                ? "booked"
                                : selectedTime === slot.time
                                ? "selected"
                                : "available"
                            }`}
                            title={
                              slot.isPast
                                ? "Past time slot"
                                : slot.booking
                                ? `Booked by ${slot.booking.customerName} (${slot.booking.customerPhone})`
                                : "Available for booking"
                            }
                          >
                            <div className="text-xs font-medium">
                              {formatTime(slot.time)}
                            </div>
                            {slot.booking && (
                              <div className="text-xs text-red-600 mt-1 space-y-0.5">
                                <div className="font-medium">Booked</div>
                                <div className="text-gray-600 truncate">
                                  {slot.booking.customerName}
                                </div>
                                <div className="text-gray-500 text-xs">
                                  {slot.booking.customerPhone}
                                </div>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>

                      {availableSlots.filter((slot) => slot.available)
                        .length === 0 && (
                        <p className="text-gray-500 text-center py-8">
                          No available slots for this date
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        Please select a date to view available time slots
                      </p>
                      <Button
                        onClick={() => setViewMode("calendar")}
                        className="mt-4"
                      >
                        Select Date
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Selected Booking Info */}
        {selectedBooking && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-red-800">
                  {isOwner ? "Booking Details" : "This Slot is Already Booked"}
                </h3>
                <div className="text-red-700 mt-2">
                  <p>
                    <strong>Customer:</strong>{" "}
                    {selectedBooking?.customerName || "N/A"}
                  </p>
                  <p>
                    <strong>Phone:</strong>{" "}
                    {selectedBooking?.customerPhone || "N/A"}
                  </p>
                  <p>
                    <strong>Time:</strong>{" "}
                    {selectedBooking?.startTime && selectedBooking?.endTime
                      ? `${formatTime(
                          selectedBooking.startTime
                        )} - ${formatTime(selectedBooking.endTime)}`
                      : "N/A"}
                  </p>
                  {isOwner && selectedBooking?.reason && (
                    <p>
                      <strong>Reason:</strong> {selectedBooking.reason}
                    </p>
                  )}
                  {!isOwner && (
                    <p className="text-sm text-gray-600 mt-2">
                      This time slot is not available for booking.
                    </p>
                  )}
                </div>
                {isOwner && (
                  <div className="mt-4">
                    <button
                      onClick={() =>
                        selectedBooking && handleCancelBooking(selectedBooking)
                      }
                      className="btn-outline text-red-600 border-red-600 hover:bg-red-50"
                    >
                      Cancel Booking
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Owner Notice */}
        {isOwner && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <Shield className="h-5 w-5" />
              <div>
                <h3 className="font-semibold">Ground Owner Access</h3>
                <p className="text-sm">
                  You are the owner of this ground. You cannot book your own
                  ground.
                </p>
                <div className="mt-2">
                  <a
                    href="/admin/dashboard"
                    className="text-yellow-700 hover:text-yellow-800 text-sm font-medium underline"
                  >
                    Go to Ground Management Dashboard →
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {ground && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          ground={{
            id: ground!.id,
            name: ground!.name,
            morningPrice: ground!.morningPrice,
            eveningPrice: ground!.eveningPrice,
          }}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          selectedEndTime={selectedEndTime}
          onBookingSuccess={() => {
            // Refresh ground data to show updated bookings
            fetchGround();
          }}
        />
      )}

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowCancelModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Cancel Booking
                </h2>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Booking Details
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <strong>Customer:</strong> {selectedBooking?.customerName}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedBooking?.customerPhone}
                  </p>
                  <p>
                    <strong>Date:</strong> {selectedBooking?.date}
                  </p>
                  <p>
                    <strong>Time:</strong>{" "}
                    {selectedBooking?.startTime && selectedBooking?.endTime
                      ? `${formatTime(
                          selectedBooking.startTime
                        )} - ${formatTime(selectedBooking.endTime)}`
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label className="label">Reason for Cancellation *</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="input-field"
                  placeholder="Please provide a reason for cancelling this booking..."
                  rows={4}
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCancelBooking}
                  className="btn-primary flex-1 bg-red-600 hover:bg-red-700"
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal &&
        ground?.images &&
        ground.images.length > 0 &&
        ground && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center">
              {/* Close button */}
              <button
                onClick={closeImageModal}
                className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Navigation buttons */}
              {ground!.images && ground!.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Image */}
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={ground?.images[currentImageIndex] || ""}
                  alt={`${ground?.name || "Ground"} - Image ${
                    currentImageIndex + 1
                  }`}
                  width={1200}
                  height={800}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    console.error("Modal image load error:", e);
                    e.currentTarget.src = "/placeholder-ground.jpg";
                  }}
                />
              </div>

              {/* Image counter */}
              {ground!.images && ground!.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {ground!.images.length}
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
