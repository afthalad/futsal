import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Edit, ChevronDown, ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

interface Shift {
  startTime: string;
  endTime: string;
  maxCapacity: number;
  price: number;
}

interface SwimmingPoolGround {
  id: string;
  name: string;
  location: string;
  city: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  shifts: Shift[];
  advancePercentage?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankBranch?: string;
  permanentCloseDate?: string;
  rejectionReason?: string;
  reviewedAt?: any;
  updatedAt?: any;
}

interface SwimmingPoolMyGroundCardProps {
  ground: SwimmingPoolGround;
  onUpdate: (groundId: string, updates: Partial<SwimmingPoolGround>) => void;
  onView: (ground: any) => void;
}

export default function SwimmingPoolMyGroundCard({
  ground,
  onUpdate,
  onView,
}: SwimmingPoolMyGroundCardProps) {
  const router = useRouter();
  const [showShifts, setShowShifts] = useState(false);

  const handlePermanentCloseDateChange = async (newDate: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login again");
      return;
    }

    try {
      const res = await fetch(`/api/grounds/${ground.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          permanentCloseDate: newDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to set close date");
        return;
      }

      onUpdate(ground.id, { permanentCloseDate: newDate });
      toast.success("Permanent close date updated");
    } catch (error) {
      console.error("Error updating close date:", error);
      toast.error("Failed to update close date");
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{ground.name}</h3>
          <p className="text-sm text-gray-600">
            {ground.location}, {ground.city}
          </p>
          <span className="text-xs text-blue-600 font-medium">
            Swimming Pool
          </span>
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
                      : ground.updatedAt,
                  ) >
                    new Date(
                      ground.reviewedAt.toDate
                        ? ground.reviewedAt.toDate()
                        : ground.reviewedAt,
                    )
                ? "Resubmitted"
                : "Under Review"}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {/* Shifts Summary */}
        <div className="border-t pt-2">
          <button
            onClick={() => setShowShifts(!showShifts)}
            className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <span>Shifts ({ground.shifts?.length || 0})</span>
            {showShifts ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {showShifts && ground.shifts && ground.shifts.length > 0 && (
            <div className="mt-2 space-y-2">
              {ground.shifts.map((shift, index) => (
                <div
                  key={index}
                  className="text-xs bg-gray-50 p-2 rounded border"
                >
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {formatTime(shift.startTime)} -{" "}
                      {formatTime(shift.endTime)}
                    </span>
                    <span className="font-medium">
                      {formatPrice(shift.price)}
                    </span>
                  </div>
                  <div className="text-gray-500 mt-1">
                    Capacity: {shift.maxCapacity} people
                  </div>
                  {ground.advancePercentage && (
                    <div className="text-blue-600 mt-1">
                      Advance:{" "}
                      {formatPrice(
                        (shift.price * parseFloat(ground.advancePercentage)) /
                          100,
                      )}{" "}
                      ({ground.advancePercentage}%)
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Info */}
        {ground.advancePercentage && (
          <div className="text-xs text-gray-600 border-t pt-2">
            <span className="font-medium">Advance Payment:</span>{" "}
            {ground.advancePercentage}%
          </div>
        )}

        {/* Rejection Reason */}
        {ground.status === "REJECTED" && ground.rejectionReason && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
            <p className="text-red-800 font-medium">Rejection Reason:</p>
            <p className="text-red-700">{ground.rejectionReason}</p>
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
              : ground.updatedAt,
          ) >
            new Date(
              ground.reviewedAt.toDate
                ? ground.reviewedAt.toDate()
                : ground.reviewedAt,
            ) && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
              <p className="text-blue-800 font-medium">
                Resubmitted for Review
              </p>
              <p className="text-blue-700">
                Your changes have been submitted for re-review.
              </p>
            </div>
          )}
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onView(ground)}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm flex items-center justify-center py-2 rounded-lg transition-colors"
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </button>
        <button
          onClick={() => router.push(`/admin/grounds/pool/${ground.id}/edit`)}
          className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm flex items-center justify-center py-2 rounded-lg transition-colors"
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </button>
      </div>
    </div>
  );
}
