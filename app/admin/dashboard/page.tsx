"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  X,
  CreditCard,
  ChevronDown,
  ChevronRight,
  Filter,
  User,
} from "lucide-react";
import MaintenanceTab from "@/components/MaintenanceTab";
import Navbar from "@/components/Navbar";
import { formatPrice, formatTime } from "@/lib/utils";
import toast from "react-hot-toast";
import ResponsiveTable from "@/components/ResponsiveTable";
import GroundOwnerCommission from "@/components/GroundOwnerCommission";
import Tooltip from "@/components/Tooltip";
import CancellationReasonModal from "@/components/CancellationReasonModal";
import GroundViewModal from "@/components/GroundViewModal";

interface Ground {
  id: string;
  name: string;
  description?: string;
  location: string;
  city: string;
  phone: string;
  secondaryPhone?: string;
  images: string[];
  amenities: string[];
  morningPrice: number;
  eveningPrice: number;
  nightPrice: number;
  isActive: boolean;
  ownerId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: any;
  createdAt: any;
  updatedAt: any;
  _count: {
    bookings: number;
  };
}

interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  cancellationReason: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  reason?: string;
  status?: string;
  ground: {
    name: string;
  };
}

interface Payment {
  id: string;
  amountPaid: number;
  amountApplied: number;
  amountRemaining: number;
  // paidAt may come as a Firestore Timestamp-like object (with toDate()),
  // or as an ISO string/number on the client after serialization. Accept any
  // shape and normalize when rendering.
  paidAt: any;
  cutoffDate: string;
  bookingsPaid?: string[];
}

export default function AdminDashboard() {
  const [grounds, setGrounds] = useState<Ground[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [groundsLoading, setGroundsLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<
    "bookings" | "grounds" | "maintenance" | "payments"
  >("bookings");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showGroundViewModal, setShowGroundViewModal] = useState(false);
  const [selectedGroundForView, setSelectedGroundForView] =
    useState<Ground | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    otherBookings: false,
    commission: false,
  });
  const [selectedGround, setSelectedGround] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const router = useRouter();

  // Maintenance form state (UI-only)
  const [maintenanceGround, setMaintenanceGround] = useState<string>("");
  const [maintenanceDate, setMaintenanceDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  // Editing existing maintenance entry
  const [editingDate, setEditingDate] = useState<string | null>(null);
  // Show/hide maintenance form
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  // Generate hourly slots from 06:00 - 24:00
  const maintenanceTimeSlots = Array.from({ length: 18 }, (_, i) => {
    const hour = 6 + i;
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${String(displayHour).padStart(2, "0")}:00 ${ampm}`;
  });
  const [selectedMaintenanceSlots, setSelectedMaintenanceSlots] = useState<
    string[]
  >([]);

  const toggleMaintenanceSlot = (slot: string) => {
    setSelectedMaintenanceSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const saveMaintenance = async () => {
    // Validate
    if (!maintenanceGround) {
      toast.error("Please select a ground for maintenance");
      return;
    }

    if (selectedMaintenanceSlots.length === 0) {
      toast.error("Please select at least one time slot");
      return;
    }

    // Find ground by name (the select stores name)
    const groundObj = grounds.find((g) => g.name === maintenanceGround);
    if (!groundObj) {
      toast.error("Selected ground not found");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    setSavingMaintenance(true);
    try {
      let body: any;

      // Convert AM/PM format to 24-hour format for storage
      const convert12To24 = (timeStr: string) => {
        const [time, meridiem] = timeStr.split(" ");
        let [hours] = time.split(":");
        let hoursNum = parseInt(hours);

        if (meridiem === "PM" && hoursNum !== 12) {
          hoursNum += 12;
        } else if (meridiem === "AM" && hoursNum === 12) {
          hoursNum = 0;
        }

        return `${String(hoursNum).padStart(2, "0")}:00`;
      };

      const convertedSlots = selectedMaintenanceSlots.map((slot) =>
        convert12To24(slot)
      );

      // If we are editing an existing maintenance entry (replace the slots for that date)
      if (editingDate) {
        // Build a new blockedSlots map based on current ground data
        const currentBlocked = (groundObj as any).blockedSlots || {};
        const newBlocked = { ...currentBlocked };
        // If no slots selected, remove the date entry
        if (convertedSlots.length === 0) {
          delete newBlocked[editingDate];
        } else {
          newBlocked[editingDate] = convertedSlots;
        }
        body = { blockedSlots: newBlocked };
      } else {
        // Normal append/merge behaviour (existing API supports maintenanceDate+slots)
        body = { maintenanceDate, slots: convertedSlots };
      }

      const res = await fetch(`/api/grounds/${groundObj.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Failed to schedule maintenance");
        return;
      }

      // Update local ground state with returned blockedSlots
      if (data.blockedSlots) {
        setGrounds((prev) =>
          prev.map((g) =>
            g.id === groundObj.id
              ? { ...g, blockedSlots: data.blockedSlots }
              : g
          )
        );
      }

      const verb = editingDate ? "updated" : "scheduled";
      toast.success(
        `Maintenance ${verb} for ${groundObj.name} on ${
          editingDate || maintenanceDate
        } (${selectedMaintenanceSlots.length} slot(s))`
      );

      // Clear selections and editing state
      setSelectedMaintenanceSlots([]);
      setMaintenanceGround("");
      setEditingDate(null);
    } catch (error) {
      console.error("Save maintenance error:", error);
      toast.error("Failed to schedule maintenance. Please try again.");
    } finally {
      setSavingMaintenance(false);
    }
  };

  const handleEditMaintenance = (date: string, slots: string[]) => {
    // Convert 24-hour format to AM/PM format
    const convert24To12 = (timeStr: string) => {
      const [hours] = timeStr.split(":");
      const hoursNum = parseInt(hours);
      const meridiem = hoursNum >= 12 ? "PM" : "AM";
      const displayHours =
        hoursNum > 12 ? hoursNum - 12 : hoursNum === 0 ? 12 : hoursNum;
      return `${String(displayHours).padStart(2, "0")}:00 ${meridiem}`;
    };

    // Populate the form for editing
    setMaintenanceDate(date);
    setSelectedMaintenanceSlots(slots.map(convert24To12));
    setEditingDate(date);
    // Set the select to the corresponding ground name if not already
    const groundObj = grounds.find((g) => (g as any).blockedSlots?.[date]);
    if (groundObj) setMaintenanceGround(groundObj.name);
    // Show the form
    setShowMaintenanceForm(true);
  };

  const handleFinishMaintenance = async (date: string) => {
    // Remove maintenance for the given date
    const groundObj = grounds.find((g) => g.name === maintenanceGround);
    if (!groundObj) {
      toast.error("Please select a ground to finish maintenance for");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    try {
      const currentBlocked = (groundObj as any).blockedSlots || {};
      const newBlocked = { ...currentBlocked };
      delete newBlocked[date];

      const res = await fetch(`/api/grounds/${groundObj.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ blockedSlots: newBlocked }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to finish maintenance");
        return;
      }

      // Update local state
      setGrounds((prev) =>
        prev.map((g) =>
          g.id === groundObj.id ? { ...g, blockedSlots: data.blockedSlots } : g
        )
      );

      toast.success(`Maintenance finished for ${groundObj.name} on ${date}`);
      // If we were editing the same date, clear editing
      if (editingDate === date) {
        setEditingDate(null);
        setSelectedMaintenanceSlots([]);
        setMaintenanceDate(new Date().toISOString().split("T")[0]);
      }
    } catch (error) {
      console.error("Finish maintenance error:", error);
      toast.error("Failed to finish maintenance. Please try again.");
    }
  };

  // Finish maintenance for a specific ground (used when listing across all grounds)
  const handleFinishMaintenanceForGround = async (
    date: string,
    groundName: string
  ) => {
    const groundObj = grounds.find((g) => g.name === groundName);
    if (!groundObj) {
      toast.error("Ground not found");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    try {
      const currentBlocked = (groundObj as any).blockedSlots || {};
      const newBlocked = { ...currentBlocked };
      delete newBlocked[date];

      const res = await fetch(`/api/grounds/${groundObj.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ blockedSlots: newBlocked }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to finish maintenance");
        return;
      }

      // Update local state
      setGrounds((prev) =>
        prev.map((g) =>
          g.id === groundObj.id ? { ...g, blockedSlots: data.blockedSlots } : g
        )
      );

      toast.success(`Maintenance finished for ${groundObj.name} on ${date}`);
      // If we were editing the same date, clear editing
      if (editingDate === date) {
        setEditingDate(null);
        setSelectedMaintenanceSlots([]);
        setMaintenanceDate(new Date().toISOString().split("T")[0]);
      }
    } catch (error) {
      console.error("Finish maintenance error:", error);
      toast.error("Failed to finish maintenance. Please try again.");
    }
  };

  const getBlockedForSelectedGround = () => {
    if (!maintenanceGround) return {} as Record<string, string[]>;
    const g = grounds.find((gr) => gr.name === maintenanceGround);
    return (g as any)?.blockedSlots || {};
  };

  // If user has selected a ground in the bookings filter, use that as the only option
  useEffect(() => {
    if (selectedGround && selectedGround !== "all") {
      setMaintenanceGround(selectedGround);
    }
  }, [selectedGround]);

  useEffect(() => {
    const initializeDashboard = async () => {
      await checkAuth();
      // Only fetch data after authentication is successful
      fetchGrounds();
      fetchBookings();
      fetchPayments();
    };
    initializeDashboard();
  }, []);

  // Set main loading to false when both data fetches are complete
  useEffect(() => {
    if (!groundsLoading && !bookingsLoading && !paymentsLoading) {
      setLoading(false);
    }
  }, [groundsLoading, bookingsLoading, paymentsLoading]);

  // // Fallback: Set loading to false after a timeout to prevent infinite loading
  // useEffect(() => {
  //   const timeout = setTimeout(() => {
  //     setLoading(false);
  //   }, 10000); // 10 second timeout

  //   return () => clearTimeout(timeout);
  // }, []);

  useEffect(() => {
    // Only fetch data when switching tabs if not already loaded
    if (activeTab === "grounds" && grounds.length === 0) {
      fetchGrounds();
    } else if (activeTab === "bookings" && bookings.length === 0) {
      fetchBookings();
    } else if (activeTab === "payments" && payments.length === 0) {
      fetchPayments();
    }
  }, [activeTab]);

  // Filter bookings based on selected ground and date
  useEffect(() => {
    let filtered = bookings;

    // Filter by ground
    if (selectedGround !== "all") {
      filtered = filtered.filter(
        (booking) => booking.ground.name === selectedGround
      );
    }

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter((booking) => booking.date === selectedDate);
    }

    // Sort bookings by date and time
    filtered = filtered.sort((a, b) => {
      const dateCompare =
        new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare === 0) {
        return a.startTime.localeCompare(b.startTime);
      }
      return dateCompare;
    });

    setFilteredBookings(filtered.reverse());
  }, [bookings, selectedGround, selectedDate]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        localStorage.removeItem("token");
        router.push("/auth/login");
        return;
      }

      const data = await response.json();
      if (data.user.role !== "GROUND_OWNER") {
        router.push("/");
        return;
      }

      // Authentication successful, allow data fetching to proceed
      // The loading state will be set to false when data fetching completes
    } catch (error) {
      // console.error('Auth check failed:', error)
      router.push("/auth/login");
    }
  };

  const fetchGrounds = async () => {
    try {
      setGroundsLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/grounds", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGrounds(data.grounds || []);
      } else {
        console.error("Failed to fetch grounds:", response.status);
      }
    } catch (error) {
      console.error("Error fetching grounds:", error);
    } finally {
      setGroundsLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      setPaymentsLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/payments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      } else {
        console.error("Failed to fetch payments:", response.status);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setBookingsLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/bookings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Sort bookings to show today's bookings first
        const sortedBookings = (data.bookings || []).sort(
          (a: Booking, b: Booking) => {
            const today = new Date().toDateString();
            const aDate = new Date(a.date).toDateString();
            const bDate = new Date(b.date).toDateString();

            // If both are today, sort by time (earliest first)
            if (aDate === today && bDate === today) {
              return a.startTime.localeCompare(b.startTime);
            }

            // If only a is today, a comes first
            if (aDate === today && bDate !== today) {
              return -1;
            }

            // If only b is today, b comes first
            if (bDate === today && aDate !== today) {
              return 1;
            }

            // If neither is today, sort by date (earliest first)
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          }
        );

        setBookings(sortedBookings);
      } else {
        console.error("Failed to fetch bookings:", response.status);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setBookingsLoading(false);
    }
  };

  const isToday = (date: string) => {
    const today = new Date().toDateString();
    const bookingDate = new Date(date).toDateString();
    return today === bookingDate;
  };

  // Normalize and format paidAt values that may be:
  // - Firestore Timestamp objects with toDate()
  // - Raw Firestore-like objects { seconds, nanoseconds } or {_seconds, _nanoseconds}
  // - numeric seconds or milliseconds
  // - ISO date strings
  const formatPaidAt = (paidAt: Payment["paidAt"]) => {
    if (!paidAt) return "";
    try {
      let d: Date;

      // Firestore Timestamp instance with toDate()
      if (
        (paidAt as any)?.toDate &&
        typeof (paidAt as any).toDate === "function"
      ) {
        d = (paidAt as any).toDate();
      } else if (typeof paidAt === "number") {
        // number may be seconds or milliseconds
        d = new Date(paidAt > 1e12 ? paidAt : paidAt * 1000);
      } else if (typeof paidAt === "string") {
        d = new Date(paidAt);
      } else if (typeof (paidAt as any).seconds === "number") {
        // Raw Firestore-like object
        const secs = (paidAt as any).seconds as number;
        const nanos = (paidAt as any).nanoseconds || 0;
        d = new Date(secs * 1000 + nanos / 1e6);
      } else if (typeof (paidAt as any)._seconds === "number") {
        const secs = (paidAt as any)._seconds as number;
        const nanos = (paidAt as any)._nanoseconds || 0;
        d = new Date(secs * 1000 + nanos / 1e6);
      } else {
        // Fallback: coerce to string then parse
        d = new Date(String(paidAt));
      }

      if (isNaN(d.getTime())) return String(paidAt);
      return d.toLocaleDateString();
    } catch (err) {
      return String(paidAt);
    }
  };

  const handleCancelBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const confirmCancelBooking = async (reason: string) => {
    if (!selectedBooking) {
      toast.error("No booking selected for cancellation");
      return;
    }

    try {
      setCancelling(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/bookings/${selectedBooking.id}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: reason }),
        }
      );

      if (response.ok) {
        toast.success(
          "Booking cancelled successfully. Customer will be notified via SMS."
        );

        // Immediately update the booking status in local state
        setBookings((prevBookings) =>
          prevBookings.map((booking) =>
            booking.id === selectedBooking.id
              ? { ...booking, status: "CANCELLED", cancellationReason: reason }
              : booking
          )
        );

        setShowCancelModal(false);
        setSelectedBooking(null);

        // Also refresh from server to ensure consistency
        fetchBookings();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Cancel booking error:", error);
      toast.error("Failed to cancel booking. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const handleViewGround = (ground: Ground) => {
    if (ground.status === "PENDING") {
      // Show modal for under review grounds
      setSelectedGroundForView(ground);
      setShowGroundViewModal(true);
    } else if (ground.status === "APPROVED") {
      // Redirect to public ground details page for approved grounds
      router.push(`/grounds/${ground.id}`);
    } else {
      // For rejected grounds, show modal
      setSelectedGroundForView(ground);
      setShowGroundViewModal(true);
    }
  };

  const totalRevenue = bookings
    .filter((booking) => booking.status !== "CANCELLED")
    .reduce((sum, booking) => sum + booking.price, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Manage your futsal grounds and bookings
              </p>
            </div>
            {/* Profile Settings - Hidden on mobile, shown on desktop */}
            <button
              onClick={() => router.push("/admin/profile")}
              className="hidden sm:inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <User className="h-4 w-4 mr-2" />
              Profile Settings
            </button>
          </div>
        </div>

        {/* Stats Cards - Mobile Optimized */}
        <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          {/* Total Revenue - Full width on mobile, 2 cols on desktop */}
          <div className="lg:col-span-full bg-gradient-to-r from-blue-500 to-blue-600 p-4 sm:p-6 rounded-lg shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs sm:text-sm font-medium">
                  Total Revenue
                </p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                  {formatPrice(totalRevenue)}
                </p>
                <p className="text-blue-100 text-xs mt-1">From all bookings</p>
              </div>
              <div className="p-2 sm:p-3 bg-white bg-opacity-20 rounded-lg">
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
            </div>
          </div>

          {/* Compact Stats - Side by side on mobile */}
          {/* <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 sm:col-span-2 lg:col-span-2">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Grounds</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {grounds.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Bookings</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {bookings.length}
                  </p>
                </div>
              </div>
            </div>
          </div> */}
        </div>

        {/* Commission Due - Mobile Optimized */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <GroundOwnerCommission />
        </div>

        {/* Tabs */}
        {grounds.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No grounds yet
            </h3>
            <p className="text-gray-600 mb-4">
              Get started by adding your first futsal ground
            </p>
            <button
              onClick={() => router.push("/admin/grounds/new")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center mx-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Ground
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-4 sm:space-x-8 px-3 sm:px-6 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("bookings")}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === "bookings"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Bookings
                </button>
                <button
                  onClick={() => setActiveTab("grounds")}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === "grounds"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  My Grounds
                </button>
                <button
                  onClick={() => setActiveTab("maintenance")}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === "maintenance"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Maintenance
                </button>
                <button
                  onClick={() => setActiveTab("payments")}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === "payments"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Payments
                </button>
              </nav>
            </div>

            <div className="p-3 sm:p-6">
              {activeTab === "grounds" ? (
                <div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                      My Grounds
                    </h2>
                    {/* The button to add a new ground should always be present if grounds exist and this tab is active */}
                    <button
                      onClick={() => router.push("/admin/grounds/new")}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center"
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Add New Ground
                    </button>
                  </div>

                  {groundsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    // If not loading, and we are in this branch (grounds.length > 0), display the grounds grid
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {grounds.map((ground) => (
                        <div
                          key={ground.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {ground.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {ground.location}, {ground.city}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                ground.status === "APPROVED"
                                  ? "bg-green-100 text-green-800"
                                  : ground.status === "REJECTED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {ground.status === "APPROVED"
                                ? "Active"
                                : ground.status === "REJECTED"
                                ? "Rejected"
                                : ground.rejectionReason &&
                                  ground.reviewedAt &&
                                  ground.updatedAt &&
                                  new Date(
                                    ground.updatedAt.toDate
                                      ? ground.updatedAt.toDate()
                                      : ground.updatedAt
                                  ) >
                                    new Date(
                                      ground.reviewedAt.toDate
                                        ? ground.reviewedAt.toDate()
                                        : ground.reviewedAt
                                    )
                                ? "Resubmitted"
                                : "Under Review"}
                            </span>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Morning:</span>
                              <span className="font-medium">
                                {formatPrice(ground.morningPrice)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Evening:</span>
                              <span className="font-medium">
                                {formatPrice(ground.eveningPrice)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Night:</span>
                              <span className="font-medium">
                                {formatPrice(ground.nightPrice)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Bookings:</span>
                              <span className="font-medium">
                                {ground._count.bookings}
                              </span>
                            </div>

                            {/* Rejection Reason */}
                            {ground.status === "REJECTED" &&
                              ground.rejectionReason && (
                                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
                                  <p className="text-red-800 font-medium">
                                    Rejection Reason:
                                  </p>
                                  <p className="text-red-700">
                                    {ground.rejectionReason}
                                  </p>
                                </div>
                              )}

                            {/* Resubmission Notice */}
                            {ground.status === "PENDING" &&
                              ground.rejectionReason &&
                              ground.reviewedAt &&
                              ground.updatedAt &&
                              new Date(
                                ground.updatedAt.toDate
                                  ? ground.updatedAt.toDate()
                                  : ground.updatedAt
                              ) >
                                new Date(
                                  ground.reviewedAt.toDate
                                    ? ground.reviewedAt.toDate()
                                    : ground.reviewedAt
                                ) && (
                                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                  <p className="text-blue-800 font-medium">
                                    Resubmitted for Review
                                  </p>
                                  <p className="text-blue-700">
                                    Your changes have been submitted for
                                    re-review.
                                  </p>
                                </div>
                              )}
                          </div>

                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewGround(ground)}
                              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm flex items-center justify-center py-2 rounded-lg transition-colors"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </button>
                            <button
                              onClick={() =>
                                router.push(`/admin/grounds/${ground.id}/edit`)
                              }
                              className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm flex items-center justify-center py-2 rounded-lg transition-colors"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : activeTab === "bookings" ? (
                <div>
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    {/* <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Ground</label>
                      <select
                        value={selectedGround}
                        onChange={(e) => setSelectedGround(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Grounds</option>
                        {grounds.map((ground) => (
                          <option key={ground.id} value={ground.name}>
                            {ground.name}
                          </option>
                        ))}
                      </select>
                    </div> */}
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filter by Date
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedGround("all");
                          setSelectedDate("");
                        }}
                        className="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                      >
                        <Filter className="h-4 w-4" />
                        Clear Filters
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDate(
                            new Date().toISOString().split("T")[0]
                          );
                        }}
                        className="px-4 py-2 text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2"
                      >
                        <Calendar className="h-4 w-4" />
                        Today
                      </button>
                    </div>
                  </div>

                  {bookingsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : filteredBookings.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {bookings.length === 0
                          ? "No bookings yet"
                          : "No bookings match your filters"}
                      </h3>
                      <p className="text-gray-600">
                        {bookings.length === 0
                          ? "Bookings will appear here when customers book your grounds"
                          : "Try adjusting your filters to see more bookings"}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          All Bookings ({filteredBookings.length})
                        </h3>
                      </div>

                      {/* Desktop Table */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Customer
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date & Time
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Price
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Reason
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredBookings.map((booking) => (
                              <tr key={booking.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-normal text-gray-900">
                                      {booking.customerName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {booking.customerPhone}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      {new Date(
                                        booking.date
                                      ).toLocaleDateString("en-LK")}
                                      {isToday(booking.date)}
                                    </div>
                                    <div className="text-gray-500">
                                      {formatTime(booking.startTime)} -{" "}
                                      {formatTime(booking.endTime)}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-900">
                                  {formatPrice(booking.price)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <Tooltip
                                    content={
                                      booking.cancellationReason ||
                                      "No reason provided"
                                    }
                                  >
                                    <div className="truncate max-w-xs cursor-help">
                                      {booking.cancellationReason
                                        ? booking.cancellationReason.length > 10
                                          ? booking.cancellationReason.substring(
                                              0,
                                              10
                                            ) + "..."
                                          : booking.cancellationReason
                                        : "-"}
                                    </div>
                                  </Tooltip>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 text-xs rounded-full ${
                                      booking.status === "CANCELLED" ||
                                      booking.status === "cancelled"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {booking.status === "CANCELLED" ||
                                    booking.status === "cancelled"
                                      ? "Cancelled"
                                      : "Active"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  {booking.status === "CANCELLED" ||
                                  booking.status === "cancelled" ? (
                                    <span></span>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        handleCancelBooking(booking)
                                      }
                                      className="text-red-600 hover:text-red-900 flex items-center gap-1"
                                    >
                                      <X className="h-4 w-4" />
                                      Cancel
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="md:hidden">
                        <ResponsiveTable
                          bookings={filteredBookings.map((booking) => ({
                            ...booking,
                            status: booking.status || "ACTIVE",
                            // Ensure cancellationReason is a primitive string, not a String object
                            cancellationReason: String(
                              booking.cancellationReason
                            ),
                          }))}
                          onCancelBooking={handleCancelBooking}
                        />
                      </div>
                    </>
                  )}
                </div>
              ) : activeTab === "maintenance" ? (
                <MaintenanceTab
                  grounds={grounds}
                  selectedGround={selectedGround}
                  maintenanceGround={maintenanceGround}
                  setMaintenanceGround={setMaintenanceGround}
                  showMaintenanceForm={showMaintenanceForm}
                  setShowMaintenanceForm={setShowMaintenanceForm}
                  maintenanceDate={maintenanceDate}
                  setMaintenanceDate={setMaintenanceDate}
                  selectedMaintenanceSlots={selectedMaintenanceSlots}
                  setSelectedMaintenanceSlots={setSelectedMaintenanceSlots}
                  maintenanceTimeSlots={maintenanceTimeSlots}
                  toggleMaintenanceSlot={toggleMaintenanceSlot}
                  savingMaintenance={savingMaintenance}
                  saveMaintenance={saveMaintenance}
                  editingDate={editingDate}
                  setEditingDate={setEditingDate}
                  handleEditMaintenance={handleEditMaintenance}
                  handleFinishMaintenance={handleFinishMaintenance}
                  handleFinishMaintenanceForGround={
                    handleFinishMaintenanceForGround
                  }
                  getBlockedForSelectedGround={getBlockedForSelectedGround}
                />
              ) : activeTab === "payments" ? (
                <div>
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Payment History
                    </h2>
                  </div>

                  {paymentsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : payments.length === 0 ? (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No payment history
                      </h3>
                      <p className="text-gray-600">
                        Your commission payments will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount Paid
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Balance
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cutoff Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {payments.map((payment) => (
                            <tr key={payment.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatPaidAt(payment.paidAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatPrice(payment.amountPaid)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatPrice(payment.amountRemaining)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {payment.cutoffDate}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                  Success
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      <CancellationReasonModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedBooking(null);
        }}
        onConfirm={confirmCancelBooking}
        title="Cancel Booking"
        bookingDetails={
          selectedBooking
            ? {
                customerName: selectedBooking?.customerName ?? "",
                customerPhone: selectedBooking?.customerPhone ?? "",
                groundName: selectedBooking?.ground?.name ?? "",
                date: selectedBooking?.date
                  ? new Date(selectedBooking.date).toLocaleDateString("en-LK")
                  : "",
                time:
                  selectedBooking?.startTime && selectedBooking?.endTime
                    ? `${formatTime(selectedBooking.startTime)} - ${formatTime(
                        selectedBooking.endTime
                      )}`
                    : "",
              }
            : undefined
        }
        loading={cancelling}
      />

      {/* Ground View Modal */}
      <GroundViewModal
        isOpen={showGroundViewModal}
        onClose={() => {
          setShowGroundViewModal(false);
          setSelectedGroundForView(null);
        }}
        ground={selectedGroundForView}
        userRole="GROUND_OWNER"
      />
    </div>
  );
}
