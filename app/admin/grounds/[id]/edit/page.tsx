"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Upload, X, Save, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import UploadProgressBar from "@/components/UploadProgressBar";
import toast from "react-hot-toast";

interface Ground {
  id: string;
  name: string;
  description: string | null;
  location: string;
  city: string;
  phone: string;
  secondaryPhone: string | null;
  morningPrice: number;
  eveningPrice: number;
  nightPrice: number;
  openingTime?: string;
  closingTime?: string;
  noClosingTime?: boolean;
  amenities: string[];
  images: string[];
  ownerId: string;
  isActive: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  operatingDays: string[];
}

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function EditGroundPage() {
  const params = useParams();
  const router = useRouter();
  const [ground, setGround] = useState<Ground | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    city: "",
    phone: "",
    secondaryPhone: "",
    morningPrice: "",
    eveningPrice: "",
    nightPrice: "",
    openingTime: "",
    closingTime: "",
    noClosingTime: false,
    amenities: [] as string[],
    images: [] as string[],
    operatingDays: [] as string[],
  });
  const [amenityInput, setAmenityInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [wasRejected, setWasRejected] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState("");
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchUserRole();
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id && userRole) {
      fetchGround();
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
      // console.error('Error fetching user role:', error)
    }
  };

  const fetchGround = async () => {
    try {
      setFetching(true);
      const token = localStorage.getItem("token");

      // Use admin endpoint for super admins, regular endpoint for ground owners
      const endpoint =
        userRole === "SUPER_ADMIN"
          ? `/api/admin/grounds/${params.id}`
          : `/api/grounds/${params.id}`;

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (response.ok) {
        setGround(data.ground);
        setWasRejected(data.ground.status === "REJECTED");
        setFormData({
          name: data.ground.name || "",
          description: data.ground.description || "",
          location: data.ground.location || "",
          city: data.ground.city || "",
          phone: data.ground.phone || "",
          secondaryPhone: data.ground.secondaryPhone || "",
          morningPrice: data.ground.morningPrice?.toString() || "",
          eveningPrice: data.ground.eveningPrice?.toString() || "",
          nightPrice: data.ground.nightPrice?.toString() || "",
          openingTime: data.ground.openingTime || "",
          closingTime: data.ground.closingTime || "",
          noClosingTime: data.ground.noClosingTime || false,
          amenities: data.ground.amenities || [],
          images: data.ground.images || [],
          operatingDays: data.ground.operatingDays?.length > 0 ? data.ground.operatingDays : daysOfWeek,
        });
      } else {
        toast.error("Ground not found");
        router.push("/admin/dashboard");
      }
    } catch (error) {
      console.error("Error fetching ground:", error);
      toast.error("Failed to load ground details");
      router.push("/admin/dashboard");
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (name === "noClosingTime") {
        const is24h = (e.target as HTMLInputElement).checked;
        return {
          ...prev,
          noClosingTime: is24h,
          openingTime: is24h ? "00:00" : prev.openingTime,
          closingTime: is24h ? "" : prev.closingTime,
        };
      }

      if (name === "closingTime") {
        const newClosing = value;
        const shouldBe24h = !newClosing || newClosing.trim() === "";
        return {
          ...prev,
          closingTime: newClosing,
          noClosingTime: shouldBe24h ? true : prev.noClosingTime,
          openingTime: shouldBe24h ? "00:00" : prev.openingTime,
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleDayToggle = (day: string) => {
    setFormData((prev) => {
      const operatingDays = prev.operatingDays.includes(day)
        ? prev.operatingDays.filter((d) => d !== day)
        : [...prev.operatingDays, day];
      return { ...prev, operatingDays };
    });
  };

  const handleAddAmenity = () => {
    if (
      amenityInput.trim() &&
      !formData.amenities.includes(amenityInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()],
      }));
      setAmenityInput("");
    }
  };

  const handleRemoveAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((a) => a !== amenity),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setLoading(true);
      setShowProgressBar(true);
      setUploadProgress(0);

      try {
        const fileArray = Array.from(files);
        const uploadedUrls: string[] = [];

        for (let i = 0; i < fileArray.length; i++) {
          const file = fileArray[i];
          setUploadMessage(
            `Uploading image ${i + 1} of ${fileArray.length}...`
          );
          setUploadProgress((i / fileArray.length) * 80);

          const formData = new FormData();
          formData.append("image", file);

          const token = localStorage.getItem("token");
          const response = await fetch("/api/upload/image", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            uploadedUrls.push(data.imageUrl);
          } else {
            throw new Error("Upload failed");
          }
        }

        setUploadMessage("Upload completed!");
        setUploadProgress(100);

        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls],
        }));
        toast.success("Images uploaded successfully");
      } catch (error) {
        console.error("Error uploading images:", error);
        toast.error("Failed to upload images");
        setShowProgressBar(false);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.location ||
      !formData.city ||
      !formData.phone
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (
      !formData.morningPrice ||
      !formData.eveningPrice ||
      !formData.nightPrice
    ) {
      toast.error(
        "Please enter all three prices (morning, evening, and night)"
      );
      return;
    }

    if (!formData.openingTime) {
      toast.error("Please enter opening time");
      return;
    }

    if (!formData.noClosingTime && !formData.closingTime) {
      toast.error('Please enter closing time or check "No closing time"');
      return;
    }



    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      // Use admin endpoint for super admins, regular endpoint for ground owners
      const endpoint =
        userRole === "SUPER_ADMIN"
          ? `/api/admin/grounds/${params.id}`
          : `/api/grounds/${params.id}`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          morningPrice: parseFloat(formData.morningPrice),
          eveningPrice: parseFloat(formData.eveningPrice),
          nightPrice: parseFloat(formData.nightPrice),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (wasRejected) {
          toast.success("Ground updated and resubmitted for review!");
        } else {
          toast.success("Ground updated successfully!");
        }
        router.push("/admin/dashboard");
      } else {
        toast.error(data.error || "Failed to update ground");
      }
    } catch (error) {
      console.error("Error updating ground:", error);
      toast.error("Failed to update ground. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this ground? This action cannot be undone."
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      // Use admin endpoint for super admins, regular endpoint for ground owners
      const endpoint =
        userRole === "SUPER_ADMIN"
          ? `/api/admin/grounds/${params.id}`
          : `/api/grounds/${params.id}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("Ground deleted successfully!");
        router.push("/admin/dashboard");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete ground");
      }
    } catch (error) {
      console.error("Error deleting ground:", error);
      toast.error("Failed to delete ground. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                Edit Ground
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Update the details of your futsal ground
              </p>
            </div>
            <button
              onClick={handleDelete}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              disabled={loading}
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete Ground</span>
              <span className="sm:hidden">Delete</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Rejection Warning */}
          {wasRejected && ground?.rejectionReason && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-xs sm:text-sm font-medium text-yellow-800">
                    Ground Previously Rejected
                  </h3>
                  <div className="mt-2 text-xs sm:text-sm text-yellow-700">
                    <p>
                      <strong>Rejection Reason:</strong>{" "}
                      {ground.rejectionReason}
                    </p>
                    <p className="mt-1">
                      Making changes will resubmit this ground for review.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Ground Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter ground name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  City *
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  required
                >
                  <option value="">Select City</option>

                  <option value="Puttalam">Puttalam</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter full address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Secondary Phone
                </label>
                <input
                  type="tel"
                  name="secondaryPhone"
                  value={formData.secondaryPhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter secondary phone number"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Describe your ground facilities and features"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Pricing
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Morning Price (LKR) *
                </label>
                <input
                  type="number"
                  name="morningPrice"
                  value={formData.morningPrice}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter morning price"
                  min="0"
                  step="100"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  06:00 AM - 04:00 PM
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Evening Price (LKR) *
                </label>
                <input
                  type="number"
                  name="eveningPrice"
                  value={formData.eveningPrice}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter evening price"
                  min="0"
                  step="100"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  04:00 PM - 06:00 PM
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Night Price (LKR) *
                </label>
                <input
                  type="number"
                  name="nightPrice"
                  value={formData.nightPrice}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter night price"
                  min="0"
                  step="100"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">After 06:00 PM</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Operating Hours
            </h2>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="noClosingTime"
                  name="noClosingTime"
                  checked={formData.noClosingTime}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="noClosingTime"
                  className="text-sm font-medium text-gray-700"
                >
                  Open 24/7
                </label>
              </div>

              {!formData.noClosingTime ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Opening Time *
                    </label>
                    <input
                      type="time"
                      name="openingTime"
                      value={formData.openingTime}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      When does your ground open?
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Closing Time
                    </label>
                    <input
                      type="time"
                      name="closingTime"
                      value={formData.closingTime}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      When does your ground close?
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Opening Days{" "}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {daysOfWeek.map((day) => (
                <div key={day} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`day-${day}`}
                    checked={formData.operatingDays.includes(day)}
                    onChange={() => handleDayToggle(day)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`day-${day}`}
                    className="ml-2 text-sm font-medium text-gray-700"
                  >
                    {day}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Amenities
            </h2>

            <div className="flex flex-wrap gap-2 mb-4">
              {formData.amenities.map((amenity, index) => (
                <span
                  key={index}
                  className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 text-xs sm:text-sm rounded-full flex items-center"
                >
                  {amenity}
                  <button
                    type="button"
                    onClick={() => handleRemoveAmenity(amenity)}
                    className="ml-1 sm:ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <input
                type="text"
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Add amenity (e.g., Parking, Changing Room, Water)"
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddAmenity())
                }
              />
              <button
                type="button"
                onClick={handleAddAmenity}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              >
                Add
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Images
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Ground ${index + 1}`}
                    className="w-full h-20 sm:h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
              <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs sm:text-sm text-gray-600 mb-2">
                Upload additional ground images
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="inline-block px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 cursor-pointer text-sm sm:text-base"
              >
                Choose Images
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2 text-sm sm:text-base"
              disabled={loading}
            >
              <Save className="h-4 w-4" />
              {loading ? "Updating..." : "Update Ground"}
            </button>
          </div>
        </form>
      </div>

      {/* Upload Progress Bar */}
      <UploadProgressBar
        isVisible={showProgressBar}
        progress={uploadProgress}
        message={uploadMessage}
        onComplete={() => setShowProgressBar(false)}
      />
    </div>
  );
}


