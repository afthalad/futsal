"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatFirebaseDate, formatPrice } from "@/lib/utils";

interface Commission {
  id: string;
  ownerId: string;
  amount: number; // Total amount paid so far (historical)
  status: "PENDING" | "PAID";
  lastUpdated: string;
  paidAt?: string;
  payableCommission?: number; // Current amount payable (unpaid)
  bookingCount?: number; // Number of bookings in current payable period
  commissionType?: "PERCENTAGE" | "FLAT"; // Type of commission for this owner
  calculatedUntil?: string; // Date until which commission was calculated
  commissionRate?: number; // 0.01 for 1% or 50 for flat rate
  balance?: number; // stored commission balance
  payments?: Array<{
    id?: string;
    amountPaid?: number;
    amountApplied?: number;
    amountRemaining?: number;
    paidAt?: string;
    cutoffDate?: string;
  }>;
  totalPaid?: number;
  lastPaymentDate?: string | null;
  totalDue?: number;
  lastPaymentRemaining?: number;
}

export default function GroundOwnerCommission() {
  const [commission, setCommission] = useState<Commission | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchCommission();
  }, []);

  // Detect screen size for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const fetchCommission = async (isManual = false) => {
    try {
      if (typeof window === "undefined") return;
      if (isManual) setRefreshing(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/commission", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const raw = data.commission || null;
        if (raw) {
          // Use totalDue from API response (already calculated server-side)
          const normalized = {
            ...raw,
            totalDue: raw.totalDue ?? 0,
            payableCommission: raw.payableCommission ?? 0,
            bookingCount:
              raw.bookingCount ?? (raw.bookings ? raw.bookings.length : 0),
            balance: raw.balance ?? raw.amount ?? 0,
            payments: raw.payments ?? [],
            lastPaymentRemaining: raw.lastPaymentRemaining ?? 0,
            totalPaid:
              raw.totalPaid ??
              (raw.payments
                ? raw.payments.reduce(
                    (s: any, p: any) => s + (p.amountPaid || 0),
                    0,
                  )
                : 0),
            lastPaymentDate: raw.lastPaymentDate ?? null,
            calculatedUntil: raw.calculatedUntil ?? raw.calculatedUntil,
            futsalBookingCount: raw.futsalBookingCount ?? 0,
            poolBookingCount: raw.poolBookingCount ?? 0,
          };
          setCommission(normalized);
        } else {
          setCommission(null);
        }
      }
    } catch (error) {
      // console.error('Error fetching commission:', error)
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  // Don't render the component if there's no commission or no total due
  if (!commission || (commission.totalDue ?? 0) === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header - Always visible */}
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div> */}
            <div>
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">
                Commission Due
              </h3>
              <div className="text-sm sm:text-base lg:text-lg text-gray-600">
                {commission?.calculatedUntil && (
                  <div className="text-sm text-gray-600 mt-1">
                    Bookings until:{" "}
                    {formatFirebaseDate(commission.calculatedUntil)}
                  </div>
                  // <div>
                  //   Calculated until:{" "}
                  //   {formatFirebaseDate(commission.calculatedUntil)}
                  // </div>
                )}
                {/* Show previous payment remaining ONLY when there is an actual payment remaining value.
                    Don't fall back to stored commission balance (commission.balance) here because
                    that `balance`/`amount` field may represent the total commission due (not a
                    previous payment's remaining amount). If you don't have a payments collection
                    yet, this prevents showing that value as a "previous balance." */}
                {/* {typeof commission?.lastPaymentRemaining === "number" &&
                  commission.lastPaymentRemaining > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                      Previous balance:{" "}
                      {formatPrice(commission.lastPaymentRemaining)}
                    </div>
                  )} */}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-lg sm:text-lg font-bold text-blue-600">
                {formatPrice(commission?.totalDue || 0)}
              </div>

              {/* <div className="text-sm text-gray-600">
                {commission?.calculatedUntil && (
                  <div>
                    Calculated until:{" "}
                    {formatFirebaseDate(commission.calculatedUntil)}
                  </div>
                )}
                {commission?.bookingCount !== undefined && (
                  <div className="text-xs text-gray-500">
                    Unpaid bookings: {commission.bookingCount}
                  </div>
                )}
              </div> */}
            </div>
            <div className="flex items-center gap-1">
              {/* Only show refresh button on desktop */}
              <button
                onClick={() => fetchCommission(true)}
                disabled={refreshing}
                className="hidden md:block p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                title="Refresh commission data"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
              {/* Only show expand/collapse button on mobile */}
              {isMobile && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title={isExpanded ? "Collapse details" : "Expand details"}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content - Always visible on desktop, expandable on mobile */}
      {(!isMobile || isExpanded) && (
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 ">
          {commission && (commission.totalDue || 0) > 0 && (
            <div className="space-y-3">
              {/* <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-800">
                    You have a commission payment due
                  </span>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(
                    commission.status
                  )}`}
                >
                  {getStatusIcon(commission.status)}
                  {commission.status}
                </span>
              </div> */}

              <div className="text-sm text-gray-500 space-y-1">
                <p>
                  To settle your commission, please transfer the amount to the
                  following bank account. After the transfer, kindly send a
                  receipt or screenshot to{" "}
                  <a
                    href="https://wa.me/94773078103"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    0773078103
                  </a>{" "}
                  via WhatsApp. Once approved by an admin, your commission
                  balance will be reset.
                </p>
                <div className="space-y-0.5 mt-5">
                  <p>
                    <strong>Bank:</strong> Amana Bank
                  </p>
                  <p>
                    <strong>Account No:</strong> 0110508832001
                  </p>
                  <p>
                    <strong>Account Name:</strong> Afthal Ahmadh
                  </p>
                </div>
              </div>
            </div>
          )}

          {commission && commission.status === "PAID" && commission.paidAt && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">
                  Last payment received: {formatFirebaseDate(commission.paidAt)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// check mobile comsission amount pc done check mobile
// update comission like smae query bookings's iocmmisionpadi shoudl be true when press paid
