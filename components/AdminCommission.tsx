"use client";

import { useState, useEffect } from "react";

interface Commission {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  groundCount: number;
  groundNames: string;
  payableCommission: number;
  bookingCount: number;
  calculatedUntil: string;
  commissionType: "PERCENTAGE" | "FLAT";
  commissionRate: number;
  status: "PENDING" | "PAID";
  lastUpdated: string;
  balance: number;
  payments: Payment[];
  totalPaid: number;
  lastPaymentDate: string | null;
  lastPaymentRemaining: number;
  totalDue: number;
  bookings: Booking[];
}

interface Payment {
  id: string;
  amountPaid: number;
  amountRemaining: number;
  paidAt: string;
  receiptUrl?: string;
}

interface Booking {
  id: string;
  customerName?: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
}

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function AdminCommissions() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOwners, setExpandedOwners] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalOwnerId, setModalOwnerId] = useState("");
  const [modalOwnerName, setModalOwnerName] = useState("");
  const [modalAmount, setModalAmount] = useState("");
  const [modalDate, setModalDate] = useState("");
  const [modalTotalDue, setModalTotalDue] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const [stats, setStats] = useState({
    totalPayableCommission: 0,
    totalDue: 0,
    pendingCount: 0,
  });

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") {
      fetchCommissions();
    }
  }, [user]);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const token = await user?.getIdToken();
      const response = await fetch("/api/admin/commissions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch commissions");

      const data = await response.json();
      setCommissions(data.commissions || []);
      setStats({
        totalPayableCommission: data.totalPayableCommission || 0,
        totalDue: data.totalDue || 0,
        pendingCount: data.pendingCount || 0,
      });
    } catch (error) {
      console.error("Error fetching commissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!modalOwnerId || !modalAmount || !modalDate) {
      alert("Please fill all fields");
      return;
    }

    try {
      setUpdating(modalOwnerId);
      const token = await user?.getIdToken();

      const formData = new FormData();
      formData.append("ownerId", modalOwnerId);
      formData.append("amountPaid", modalAmount);
      formData.append("paidAt", modalDate);
      if (receiptFile) {
        formData.append("receipt", receiptFile);
      }

      const response = await fetch("/api/admin/commissions/mark-paid", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to mark as paid");

      await fetchCommissions();
      setShowModal(false);
      setModalOwnerId("");
      setModalAmount("");
      setModalDate("");
      setReceiptFile(null);
      setReceiptPreview(null);
    } catch (error) {
      console.error("Error marking as paid:", error);
      alert("Failed to mark payment");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Commission Management
        </h1>
        <p className="text-gray-600 mt-1">
          View and manage ground owner commissions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600">
            Payable Commission
          </h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatPrice(stats.totalPayableCommission)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600">Total Due</h3>
          <p className="text-2xl font-bold text-amber-600 mt-2">
            {formatPrice(stats.totalDue)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600">Pending Owners</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {stats.pendingCount}
          </p>
        </div>
      </div>

      {/* Commissions List */}
      <div className="space-y-4">
        {commissions.map((commission) => (
          <div
            key={commission.id}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-lg">
                  {commission.ownerName}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  📞 {commission.ownerPhone}
                </p>
                <p className="text-sm text-gray-600">
                  🏟️ {commission.groundCount} Ground(s):{" "}
                  {commission.groundNames}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  📅 Unpaid bookings: {commission.bookingCount}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Commission Type: {commission.commissionType} (
                  {commission.commissionType === "PERCENTAGE"
                    ? `${commission.commissionRate * 100}%`
                    : formatPrice(commission.commissionRate)}
                  )
                </p>
                <p className="text-xs text-gray-500">
                  Last updated:{" "}
                  {new Date(commission.lastUpdated).toLocaleString("en-LK")}
                </p>
              </div>

              <div className="text-right ml-4">
                <div className="text-lg font-bold text-primary-600">
                  {formatPrice(commission.payableCommission)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Payable Commission
                </div>
                {commission.lastPaymentRemaining > 0 && (
                  <div className="text-sm text-amber-600 mt-1">
                    + {formatPrice(commission.lastPaymentRemaining)} remaining
                  </div>
                )}
                <div className="text-sm font-semibold text-gray-900 mt-1 border-t pt-1">
                  Total Due: {formatPrice(commission.totalDue)}
                </div>
                <div
                  className={`mt-2 px-3 py-1 text-xs font-medium rounded-full inline-block ${
                    commission.status === "PENDING"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {commission.status}
                </div>
              </div>
            </div>

            {/* Bookings Section */}
            {commission.bookings && commission.bookings.length > 0 && (
              <div className="mt-3 border-t pt-3">
                <button
                  onClick={() => {
                    if (expandedOwners.includes(commission.ownerId)) {
                      setExpandedOwners(
                        expandedOwners.filter((id) => id !== commission.ownerId)
                      );
                    } else {
                      setExpandedOwners([
                        ...expandedOwners,
                        commission.ownerId,
                      ]);
                    }
                  }}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  {expandedOwners.includes(commission.ownerId)
                    ? "▼ Hide bookings"
                    : `▶ Show ${commission.bookings.length} unpaid bookings`}
                </button>

                {expandedOwners.includes(commission.ownerId) && (
                  <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                    {commission.bookings.map((b: Booking) => (
                      <div
                        key={b.id}
                        className="p-3 border rounded bg-gray-50 hover:bg-gray-100 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {b.customerName || "Walk-in Customer"}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              📅 {b.date} • 🕐 {b.startTime} - {b.endTime}
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-primary-600">
                            {formatPrice(b.price || 0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Payments Section */}
            {commission.payments && commission.payments.length > 0 && (
              <div className="mt-3 border-t pt-3">
                <h5 className="text-sm font-semibold text-gray-700 mb-2">
                  Payment History ({commission.payments.length})
                </h5>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {commission.payments.map((p: Payment) => (
                    <div
                      key={p.id || `${p.paidAt}-${p.amountPaid}`}
                      className="flex items-center justify-between p-2 border rounded bg-white hover:bg-gray-50 transition"
                    >
                      <div className="flex-1">
                        <div className="text-sm text-gray-800">
                          📅{" "}
                          {p.paidAt
                            ? new Date(p.paidAt).toLocaleDateString("en-LK")
                            : "N/A"}
                        </div>
                        {p.amountRemaining > 0 && (
                          <div className="text-xs text-amber-600">
                            Remaining: {formatPrice(p.amountRemaining)}
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-green-600">
                        {formatPrice(p.amountPaid || 0)}
                      </div>
                      {p.receiptUrl && (
                        <a
                          href={p.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-xs text-blue-600 hover:underline"
                        >
                          📄 Receipt
                        </a>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-sm text-gray-600 border-t pt-2">
                  Total Paid:{" "}
                  <span className="font-semibold">
                    {formatPrice(commission.totalPaid)}
                  </span>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="flex gap-2 mt-4 border-t pt-3">
              {commission.payableCommission > 0 ? (
                <button
                  onClick={() => {
                    setModalOwnerId(commission.ownerId);
                    setModalTotalDue(commission.totalDue);
                    setModalOwnerName(
                      commission.ownerName || commission.ownerPhone
                    );
                    setModalAmount(String(commission.payableCommission));
                    setModalDate(new Date().toISOString().split("T")[0]);
                    setReceiptFile(null);
                    setReceiptPreview(null);
                    setShowModal(true);
                  }}
                  disabled={updating === commission.ownerId}
                  className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 transition"
                >
                  {updating === commission.ownerId && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {updating === commission.ownerId
                    ? "Processing..."
                    : "💰 Mark as Paid"}
                </button>
              ) : (
                <span className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg">
                  ✓ No commission due
                </span>
              )}
            </div>
          </div>
        ))}

        {commissions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600">No commissions found</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Record Payment for {modalOwnerName}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Due
                </label>
                <div className="text-xl font-bold text-amber-600">
                  {formatPrice(modalTotalDue)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Paid
                </label>
                <input
                  type="number"
                  value={modalAmount}
                  onChange={(e) => setModalAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receipt (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                {receiptPreview && (
                  <img
                    src={receiptPreview}
                    alt="Receipt preview"
                    className="mt-2 max-h-32 rounded"
                  />
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleMarkAsPaid}
                disabled={!!updating}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                Confirm Payment
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={!!updating}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
