"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import FutsalGroundForm from "@/components/FutsalGroundForm";
import SwimmingPoolForm from "@/components/SwimmingPoolForm";

export default function NewGroundPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groundType = searchParams.get("type") || "futsal";

  useEffect(() => {
    if (!groundType || !["futsal", "swimmingpool"].includes(groundType)) {
      router.push("/admin/grounds/select");
    }
  }, [groundType, router]);

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
            Add New{" "}
            {groundType === "swimmingpool" ? "Swimming Pool" : "Futsal Ground"}
          </h1>
          <p className="text-gray-600">
            Fill in the details of your{" "}
            {groundType === "swimmingpool" ? "swimming pool" : "futsal ground"}
          </p>
        </div>

        {groundType === "swimmingpool" ? (
          <SwimmingPoolForm />
        ) : (
          <FutsalGroundForm />
        )}
      </div>
    </div>
  );
}
