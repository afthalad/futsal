import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Edit } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

interface Ground {
  id: string;
  name: string;
  location: string;
  city: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  morningPrice: number;
  eveningPrice: number;
  nightPrice: number;
  permanentCloseDate?: string;
  rejectionReason?: string;
  reviewedAt?: any;
  updatedAt?: any;
  _count: {
    bookings: number;
  };
}

interface FutsalMyGroundCardProps {
  ground: Ground;
  onUpdate: (groundId: string, updates: Partial<Ground>) => void;
  onView: (ground: any) => void;
}

export default function FutsalMyGroundCard({
  ground,
  onUpdate,
  onView,
}: FutsalMyGroundCardProps) {
  const router = useRouter();

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

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{ground.name}</h3>
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
          <span className="font-medium">{formatPrice(ground.nightPrice)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Bookings:</span>
          <span className="font-medium">{ground._count.bookings}</span>
        </div>

        {/* Permanent Close Date Feature */}
        <div className="flex flex-col gap-1 mt-2">
          <span className="text-gray-600 text-xs">Permanent Close Date:</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={ground.permanentCloseDate || ""}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => handlePermanentCloseDateChange(e.target.value)}
              className="border px-2 py-1 rounded text-sm"
            />
            {ground.permanentCloseDate && (
              <span className="text-xs text-gray-500">
                (Current: {ground.permanentCloseDate})
              </span>
            )}
          </div>
        </div>

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
          onClick={() => router.push(`/admin/grounds/${ground.id}/edit`)}
          className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm flex items-center justify-center py-2 rounded-lg transition-colors"
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </button>
      </div>
    </div>
  );
}
