"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import SwimmingPoolForm from "@/components/SwimmingPoolForm";
import toast from "react-hot-toast";

interface SwimmingPool {
  id: string;
  name: string;
  description: string;
  location: string;
  city: string;
  phone: string;
  secondaryPhone: string;
  isListing: boolean;
  customerRules: string;
  advancePercentage: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  bankBranch: string;
  images: string[];
  shifts: Array<{
    startTime: string;
    endTime: string;
    maxCapacity: number;
    price: number;
  }>;
  ownerId: string;
  isActive: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  type: string;
}

export default function EditSwimmingPoolPage() {
  const params = useParams();
  const router = useRouter();
  const [pool, setPool] = useState<SwimmingPool | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchUserRole();
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id && userRole) {
      fetchPool();
    }
  }, [params.id, userRole]);

  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (response.ok) {
        setUserRole(data.user.role);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const fetchPool = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/grounds/pool/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok) {
        setPool(data.ground);
      } else {
        toast.error(data.error || "Swimming pool not found");
        router.push("/admin/dashboard");
      }
    } catch (error) {
      console.error("Error fetching swimming pool:", error);
      toast.error("Failed to load swimming pool details");
      router.push("/admin/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              Loading swimming pool details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Swimming Pool Not Found
            </h1>
            <p className="text-gray-600 mt-2">
              The swimming pool you're looking for doesn't exist.
            </p>
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="mt-4 bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Transform pool data to match form expectations
  const initialData = {
    name: pool.name,
    description: pool.description,
    location: pool.location,
    city: pool.city,
    phone: pool.phone,
    secondaryPhone: pool.secondaryPhone,
    isListing: pool.isListing,
    customerRules: pool.customerRules,
    advancePercentage: pool.advancePercentage,
    bankAccountName: pool.bankAccountName,
    bankAccountNumber: pool.bankAccountNumber,
    bankName: pool.bankName,
    bankBranch: pool.bankBranch,
    images: pool.images,
    shifts: pool.shifts.map((shift) => ({
      startTime: shift.startTime,
      endTime: shift.endTime,
      maxCapacity: shift.maxCapacity,
      price: shift.price.toString(), // Convert to string for form
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Swimming Pool
          </h1>
          <p className="text-gray-600">
            Update the details of your swimming pool
          </p>
          {pool.status === "REJECTED" && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">
                This swimming pool was rejected. Please review and update the
                details before resubmitting.
              </p>
            </div>
          )}
        </div>

        <SwimmingPoolForm
          initialData={initialData}
          poolId={pool.id}
          isEditing={true}
        />
      </div>
    </div>
  );
}
