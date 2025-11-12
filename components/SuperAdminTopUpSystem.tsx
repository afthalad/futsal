"use client";

import { useState, useEffect } from "react";
import { DollarSign, AlertCircle, RefreshCw, Users } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Commission {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  groundCount: number;
  groundNames: string;
  payableCommission: number;
  lastPaymentRemaining: number;
  totalDue: number;
  payments:
    | {
        id: string;
        amountPaid: number;
        amountRemaining: number;
        paidAt: string;
      }[]
    | [];
  status: "PENDING" | "PAID";
  lastUpdated: Date;
  lastPaymentDate: string | null;
  bookings:
    | {
        id: string;
        customerName: string;
        date: string;
        startTime: string;
        endTime: string;
        price: number;
      }[]
    | [];
}

export default function SuperAdminTopUpSystem() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchCommissions();

    // Refresh every 30 seconds to get updated commission data
    const interval = setInterval(fetchCommissions, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchCommissions = async () => {
    try {
      // Check if we're on the client side
      if (typeof window === "undefined") {
        return;
      }

      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/commission", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCommissions(data.commissions || []);
        setTotalAmount(data.totalAmount || 0);
        setPendingCount(data.pendingCount || 0);
      } else {
        console.error("Failed to fetch commissions");
      }
    } catch (error) {
      console.error("Error fetching commissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const markCommissionAsPaid = async (ownerId: string) => {
    try {
      setUpdating(ownerId);

      // Check if we're on the client side
      if (typeof window === "undefined") {
        return;
      }

      const token = localStorage.getItem("token");

      const response = await fetch(
        `/api/admin/commission/${ownerId}/mark-paid`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // Refresh the commissions data
        await fetchCommissions();
      } else {
        console.error("Failed to mark commission as paid");
      }
    } catch (error) {
      console.error("Error marking commission as paid:", error);
    } finally {
      setUpdating(null);
    }
  };

  const confirmMarkAsPaid = async () => {
    if (!modalOwnerId) return;
    const ownerId = modalOwnerId;
    const amount = Number(modalAmount);
    const totalDue = modalTotalDue;
    const date = modalDate;

    if (!amount || isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setModalSubmitting(true);
    setUpdating(ownerId);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/admin/commission/${ownerId}/mark-paid`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount, date, totalDue }),
        }
      );

      if (response.ok) {
        setShowModal(false);
        await fetchCommissions();
      } else {
        const err = await response.json().catch(() => ({} as any));
        console.error("Failed to mark commission as paid", err);
        alert(err?.error || "Failed to mark commission as paid");
      }
    } catch (error) {
      console.error("Error marking commission as paid:", error);
      alert("Unexpected error");
    } finally {
      setModalSubmitting(false);
      setUpdating(null);
    }
  };

  const totalGroundOwners = commissions.length;
  const groundOwnersWithDues = commissions.filter(
    (commission) => commission.totalDue > 0
  ).length;
  const [expandedOwners, setExpandedOwners] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalOwnerId, setModalOwnerId] = useState<string | null>(null);
  const [modalOwnerName, setModalOwnerName] = useState<string | null>(null);
  const [modalAmount, setModalAmount] = useState<string>("");
  const [modalTotalDue, setModalTotalDue] = useState<number>(0);
  const [modalDate, setModalDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [modalSubmitting, setModalSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <DollarSign className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Commission Management
            </h2>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary-600">
            {formatPrice(totalAmount)}
          </div>
          <div className="text-sm text-gray-600">Total Due</div>
        </div>
      </div>

      {/* Summary Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Ground Owners</p>
              <p className="text-xl font-bold text-gray-900">{totalGroundOwners}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">With Dues</p>
              <p className="text-xl font-bold text-gray-900">{groundOwnersWithDues}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-xl font-bold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </div>
      </div> */}

      {commissions.length === 0 ? (
        <div className="text-center py-8">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No ground owners found
          </h3>
          <p className="text-gray-600">
            Commission data will appear here when ground owners have bookings
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {commissions.map((commission) => (
            <div
              key={commission.id}
              className="border border-gray-200 rounded-lg p-4"
              >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {commission.ownerName}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Phone: {commission.ownerPhone}
                  </p>
                  <p className="text-sm text-gray-600">
                    Grounds: {commission.groundCount} ({commission.groundNames})
                  </p>
                  {/* <p className="text-sm text-gray-600 mt-1">
                    Unpaid bookings: {commission.bookings.length}
                  </p> */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">Last updated:</span>
                    <span className="text-xs text-gray-500">
                      {commission.lastUpdated
                        ? new Date(commission.lastUpdated).toLocaleDateString(
                            "en-LK"
                          )
                        : "N/A"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary-600">
                    {formatPrice(commission.totalDue)}
                  </div>
                  <div className="mt-1 space-y-1">
                    {/* <div className="text-xs text-gray-500">
                        Commission: {formatPrice(commission.payableCommission)}
                      </div> */}
                    {commission.lastPaymentRemaining > 0 && (
                      <div className="text-xs text-gray-500">
                        Previous Balance:{" "}
                        {formatPrice(commission.lastPaymentRemaining)}
                      </div>
                    )}
                  </div>
                  <div
                    className={`mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                      commission.status === "PENDING"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {commission.status}
                  </div>
                </div>
              </div>
              {(commission.bookings.length > 0 ||
                commission.payments.length > 0) && (
                <div className="mt-3">
                  <div className="flex gap-4">
                    {commission.bookings.length > 0 && (
                      <button
                        onClick={() => {
                          if (
                            expandedOwners.includes(
                              commission.ownerId + "_bookings"
                            )
                          ) {
                            setExpandedOwners(
                              expandedOwners.filter(
                                (id) => id !== commission.ownerId + "_bookings"
                              )
                            );
                          } else {
                            setExpandedOwners([
                              ...expandedOwners,
                              commission.ownerId + "_bookings",
                            ]);
                          }
                        }}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {expandedOwners.includes(
                          commission.ownerId + "_bookings"
                        )
                          ? "Hide bookings"
                          : `Show ${commission.bookings.length} unpaid bookings`}
                      </button>
                    )}

                    {commission.payments.length > 0 && (
                      <button
                        onClick={() => {
                          if (
                            expandedOwners.includes(
                              commission.ownerId + "_payments"
                            )
                          ) {
                            setExpandedOwners(
                              expandedOwners.filter(
                                (id) => id !== commission.ownerId + "_payments"
                              )
                            );
                          } else {
                            setExpandedOwners([
                              ...expandedOwners,
                              commission.ownerId + "_payments",
                            ]);
                          }
                        }}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {expandedOwners.includes(
                          commission.ownerId + "_payments"
                        )
                          ? "Hide payment history"
                          : `Show payment history (${commission.payments.length})`}
                      </button>
                    )}
                  </div>

                  {expandedOwners.includes(commission.ownerId + "_bookings") &&
                    commission.bookings.length > 0 && (
                      <div className="mt-2 space-y-2">
                        <h5 className="text-sm font-medium text-gray-900">
                          Unpaid Bookings
                        </h5>
                        {commission.bookings.map((b: any) => (
                          <div
                            key={b.id}
                            className="p-2 border rounded bg-gray-50"
                          >
                            <div className="text-sm text-gray-800">
                              {b.customerName || "Walk-in"}
                            </div>
                            <div className="text-xs text-gray-600">
                              {b.date} {b.startTime}-{b.endTime}
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatPrice(b.price || 0)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  {expandedOwners.includes(commission.ownerId + "_payments") &&
                    commission.payments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        <h5 className="text-sm font-medium text-gray-900">
                          Payment History
                        </h5>
                        {commission.payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="p-2 border rounded bg-gray-50"
                          >
                            <div className="flex justify-between">
                              <div>
                                <div className="text-sm text-gray-800">
                                  Paid: {formatPrice(payment.amountPaid)}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {new Date(payment.paidAt).toLocaleDateString(
                                    "en-LK"
                                  )}
                                </div>
                              </div>
                              {payment.amountRemaining > 0 && (
                                <div className="text-right">
                                  <div className="text-xs text-gray-500">
                                    Remaining
                                  </div>
                                  <div className="text-sm text-gray-900">
                                    {formatPrice(payment.amountRemaining)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              )}

              {/* {commission.lastPaymentDate && (
                <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
                  <span className="text-green-800">
                    Last paid:{" "}
                    {commission.lastPaymentDate
                      ? new Date(commission.lastPaymentDate).toLocaleDateString(
                          "en-LK"
                        )
                      : "N/A"}
                  </span>
                </div>
              )} */}

              <div className="flex gap-2">
                {commission.totalDue > 0 && (
                  <button
                    onClick={() => {
                      // Open modal to enter amount and date
                      setModalOwnerId(commission.ownerId);
                      setModalTotalDue(commission.totalDue);
                      setModalOwnerName(
                        commission.ownerName || commission.ownerPhone
                      );
                      setModalAmount(String(commission.totalDue));
                      setModalDate(new Date().toISOString().split("T")[0]);
                      setShowModal(true);
                    }}
                    disabled={updating === commission.ownerId}
                    className="px-3 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    {updating === commission.ownerId && (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    )}
                    {updating === commission.ownerId
                      ? "Marking..."
                      : "Mark as Paid"}
                  </button>
                )}
                {commission.totalDue === 0 && (
                  <span className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    No commission due
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Modal for entering payment details */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black opacity-40"
            onClick={() => setShowModal(false)}
          ></div>
          <div className="bg-white rounded-lg shadow-lg z-10 w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-3">
              Mark Commission as Paid
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Owner: {modalOwnerName}
            </p>

            <label className="block text-sm mb-2">Amount</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2 mb-3"
              value={modalAmount}
              onChange={(e) => setModalAmount(e.target.value)}
            />

            <label className="block text-sm mb-2">Payment Date</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2 mb-4"
              value={modalDate}
              onChange={(e) => setModalDate(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 text-sm bg-gray-100 rounded"
                onClick={() => setShowModal(false)}
                disabled={modalSubmitting}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 text-sm bg-primary-600 text-white rounded"
                onClick={confirmMarkAsPaid}
                disabled={modalSubmitting}
              >
                {modalSubmitting ? "Processing..." : "Confirm & Apply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
