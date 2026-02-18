"use client";

import { useState } from "react";
import {
  X,
  MapPin,
  Phone,
  Clock,
  DollarSign,
  Star,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  CreditCard,
  Droplets,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Shift {
  startTime: string;
  endTime: string;
  maxCapacity: number;
  price: number;
}

interface SwimmingPoolGround {
  id: string;
  name: string;
  description?: string;
  location: string;
  city: string;
  phone: string;
  secondaryPhone?: string;
  images: string[];
  shifts: Shift[];
  advancePercentage?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankBranch?: string;
  customerRules?: string;
  ownerId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: any;
  createdAt: any;
  updatedAt: any;
  owner?: {
    name?: string;
    phone: string;
  };
}

interface SwimmingPoolViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  ground: SwimmingPoolGround | null;
  userRole?: "GROUND_OWNER" | "SUPER_ADMIN";
  onApprove?: (groundId: string) => void;
  onReject?: (groundId: string, reason: string) => void;
  isProcessing?: boolean;
}

export default function SwimmingPoolViewModal({
  isOpen,
  onClose,
  ground,
  userRole = "GROUND_OWNER",
  onApprove,
  onReject,
  isProcessing = false,
}: SwimmingPoolViewModalProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!isOpen || !ground) return null;

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleApprove = () => {
    if (onApprove) {
      onApprove(ground.id);
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }
    if (onReject) {
      onReject(ground.id, rejectionReason.trim());
    }
  };

  const handleClose = () => {
    setRejectionReason("");
    setShowRejectForm(false);
    onClose();
  };

  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const canReview = isSuperAdmin && ground.status === "PENDING";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Swimming Pool Details
              </h2>
            </div>
            <p className="text-gray-600 mt-1">
              {isSuperAdmin
                ? "Review all details before approving or rejecting"
                : "View your swimming pool information"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isProcessing}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Pool Owner Info - Only show for Super Admin */}
          {isSuperAdmin && ground.owner && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="h-5 w-5" />
                Pool Owner Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Owner Name
                  </label>
                  <p className="text-gray-900">
                    {ground.owner.name || "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <p className="text-gray-900">{ground.owner.phone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Pool Name
                </label>
                <p className="text-gray-900 font-medium">{ground.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <p className="text-gray-900">{ground.city}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <p className="text-gray-900">{ground.location}</p>
              </div>
              {ground.description && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <p className="text-gray-900">{ground.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Primary Phone
                </label>
                <p className="text-gray-900">{ground.phone}</p>
              </div>
              {ground.secondaryPhone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Secondary Phone
                  </label>
                  <p className="text-gray-900">{ground.secondaryPhone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Shifts */}
          {ground.shifts && ground.shifts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Available Shifts
              </h3>
              <div className="space-y-3">
                {ground.shifts.map((shift, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Time Slot
                        </label>
                        <p className="text-gray-900 font-medium">
                          {formatTime(shift.startTime)} -{" "}
                          {formatTime(shift.endTime)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Max Capacity
                        </label>
                        <p className="text-gray-900">
                          {shift.maxCapacity} people
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Price
                        </label>
                        <p className="text-gray-900 font-medium">
                          {formatPrice(shift.price)}
                        </p>
                      </div>
                    </div>
                    {ground.advancePercentage && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700">
                          Advance Payment Required
                        </label>
                        <p className="text-blue-600 font-medium">
                          {formatPrice(
                            (shift.price *
                              parseFloat(ground.advancePercentage)) /
                              100,
                          )}{" "}
                          ({ground.advancePercentage}% of total)
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Settings */}
          {ground.advancePercentage && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Settings
              </h3>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Advance Payment Percentage
                    </label>
                    <p className="text-gray-900 font-medium text-2xl">
                      {ground.advancePercentage}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bank Details */}
          {(ground.bankAccountName ||
            ground.bankAccountNumber ||
            ground.bankName) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Bank Account Details
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ground.bankAccountName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Account Holder Name
                      </label>
                      <p className="text-gray-900">{ground.bankAccountName}</p>
                    </div>
                  )}
                  {ground.bankAccountNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Account Number
                      </label>
                      <p className="text-gray-900 font-mono">
                        {ground.bankAccountNumber}
                      </p>
                    </div>
                  )}
                  {ground.bankName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Bank Name
                      </label>
                      <p className="text-gray-900">{ground.bankName}</p>
                    </div>
                  )}
                  {ground.bankBranch && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Branch
                      </label>
                      <p className="text-gray-900">{ground.bankBranch}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Customer Rules */}
          {ground.customerRules && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Star className="h-5 w-5" />
                Rules & Guidelines
              </h3>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <p className="text-gray-900 whitespace-pre-line">
                  {ground.customerRules}
                </p>
              </div>
            </div>
          )}

          {/* Images */}
          {ground.images && ground.images.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>Pool Images</span>
                <span className="text-sm font-normal text-gray-500">
                  ({ground.images.length} image
                  {ground.images.length !== 1 ? "s" : ""})
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ground.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`${ground.name} - Image ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => window.open(image, "_blank")}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                        Click to view full size
                      </span>
                    </div>
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Click on any image to view it in full size.
              </p>
            </div>
          )}

          {/* Status Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Status Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Submitted On
                </label>
                <p className="text-gray-900">
                  {new Date(
                    ground.createdAt._seconds * 1000,
                  ).toLocaleDateString("en-LK", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Current Status
                </label>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    ground.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : ground.status === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {ground.status === "PENDING"
                    ? "Under Review"
                    : ground.status === "APPROVED"
                      ? "Approved"
                      : "Rejected"}
                </span>
              </div>
            </div>

            {/* Rejection Reason */}
            {ground.status === "REJECTED" && ground.rejectionReason && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Rejection Reason
                </label>
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{ground.rejectionReason}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200 bg-gray-50">
          {!canReview ? (
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          ) : !showRejectForm ? (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                className="px-4 py-2 text-red-700 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                disabled={isProcessing}
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                disabled={isProcessing}
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowRejectForm(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isProcessing}
              >
                Back
              </button>
              <div className="flex-1 max-w-md">
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                  disabled={isProcessing}
                />
              </div>
              <button
                onClick={handleReject}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                disabled={isProcessing || !rejectionReason.trim()}
              >
                <XCircle className="h-4 w-4" />
                {isProcessing ? "Processing..." : "Reject"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
