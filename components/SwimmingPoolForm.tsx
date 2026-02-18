"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Camera, Upload, Plus } from "lucide-react";
import PhotoSelectionModal from "@/components/PhotoSelectionModal";
import UploadProgressBar from "@/components/UploadProgressBar";
import {
  compressAndConvertToWebP,
  validateImageFile,
  getFileSize,
} from "@/lib/image-utils";
import toast from "react-hot-toast";

interface SwimmingPoolData {
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
    price: string;
  }>;
}

interface SwimmingPoolFormProps {
  initialData?: Partial<SwimmingPoolData>;
  poolId?: string;
  isEditing?: boolean;
}

export default function SwimmingPoolForm({
  initialData,
  poolId,
  isEditing = false,
}: SwimmingPoolFormProps) {
  const router = useRouter();

  const getInitialFormData = (): SwimmingPoolData => ({
    name: "",
    description: "",
    location: "",
    city: "",
    phone: "",
    secondaryPhone: "",
    isListing: false,
    customerRules: "",
    advancePercentage: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankName: "",
    bankBranch: "",
    images: [],
    shifts: [
      { startTime: "06:00", endTime: "09:00", maxCapacity: 20, price: "" },
    ],
  });

  const [poolFormData, setPoolFormData] = useState<SwimmingPoolData>(() => {
    if (initialData) {
      return {
        ...getInitialFormData(),
        ...initialData,
        shifts: initialData.shifts || [
          { startTime: "06:00", endTime: "09:00", maxCapacity: 20, price: "" },
        ],
      };
    }
    return getInitialFormData();
  });

  const [loading, setLoading] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState("");
  const [showProgressBar, setShowProgressBar] = useState(false);

  // Update form data when initial data changes (for async loading)
  useEffect(() => {
    if (initialData) {
      setPoolFormData((prev) => ({
        ...prev,
        ...initialData,
        shifts:
          initialData.shifts && initialData.shifts.length > 0
            ? initialData.shifts
            : prev.shifts,
      }));
    }
  }, [initialData]);

  const handlePhotoTaken = async (file: File) => {
    await processAndUploadImage(file);
  };

  const handleFileSelected = async (file: File) => {
    await processAndUploadImage(file);
  };

  const processAndUploadImage = async (file: File) => {
    setUploadingImages(true);
    setShowProgressBar(true);
    setUploadProgress(0);

    try {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error || "Invalid file");
        return;
      }

      const originalSize = getFileSize(file.size);
      setUploadMessage(`Processing image (${originalSize})...`);
      setUploadProgress(20);

      const compressedFile = await compressAndConvertToWebP(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
      });

      const compressedSize = getFileSize(compressedFile.size);
      setUploadMessage(`Uploading compressed image `);
      setUploadProgress(60);

      const uploadFormData = new FormData();
      uploadFormData.append("image", compressedFile);

      const token = localStorage.getItem("token");
      const response = await fetch("/api/upload/image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      setUploadProgress(90);

      if (response.ok) {
        const data = await response.json();
        setPoolFormData((prev) => ({
          ...prev,
          images: [...prev.images, data.imageUrl],
        }));
        setUploadMessage("Upload completed!");
        setUploadProgress(100);
        toast.success(`Image uploaded successfully! `);
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to upload image");
      setShowProgressBar(false);
    } finally {
      setUploadingImages(false);
      setShowPhotoModal(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setPoolFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handlePoolInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setPoolFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleShiftChange = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    setPoolFormData((prev) => {
      const newShifts = [...prev.shifts];
      newShifts[index] = { ...newShifts[index], [field]: value };
      return { ...prev, shifts: newShifts };
    });
  };

  const addShift = () => {
    setPoolFormData((prev) => ({
      ...prev,
      shifts: [
        ...prev.shifts,
        { startTime: "09:00", endTime: "12:00", maxCapacity: 20, price: "" },
      ],
    }));
  };

  const removeShift = (index: number) => {
    if (poolFormData.shifts.length > 1) {
      setPoolFormData((prev) => ({
        ...prev,
        shifts: prev.shifts.filter((_, i) => i !== index),
      }));
    }
  };

  const handlePoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !poolFormData.name ||
      !poolFormData.location ||
      !poolFormData.city ||
      !poolFormData.phone
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!poolFormData.advancePercentage) {
      toast.error("Please enter advance payment percentage");
      return;
    }

    if (
      !poolFormData.bankAccountName ||
      !poolFormData.bankAccountNumber ||
      !poolFormData.bankName
    ) {
      toast.error("Please fill in all bank account details");
      return;
    }

    if (poolFormData.shifts.length === 0) {
      toast.error("Please add at least one shift");
      return;
    }

    const hasInvalidShift = poolFormData.shifts.some(
      (shift) => !shift.price || parseFloat(shift.price) <= 0,
    );
    if (hasInvalidShift) {
      toast.error("Please enter valid prices for all shifts");
      return;
    }

    setLoading(true);
    console.log(`🏊 Starting pool ${isEditing ? "update" : "submission"}...`);
    console.log("Pool data:", poolFormData);

    try {
      const token = localStorage.getItem("token");
      console.log("Token exists:", !!token);

      const payload = {
        ...poolFormData,
        shifts: poolFormData.shifts.map((shift) => ({
          startTime: shift.startTime,
          endTime: shift.endTime,
          maxCapacity: parseInt(shift.maxCapacity.toString()),
          price: parseFloat(shift.price.toString()),
        })),
      };

      console.log("Sending payload:", JSON.stringify(payload, null, 2));

      const url = isEditing
        ? `/api/grounds/pool/${poolId}`
        : "/api/grounds/pool";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(
          errorData.error ||
            `Failed to ${isEditing ? "update" : "add"} swimming pool`,
        );
        return;
      }

      const data = await response.json();
      toast.success(
        isEditing
          ? "Swimming pool updated successfully!"
          : "Swimming pool submitted for review!",
      );
      router.push("/admin/dashboard");
    } catch (error) {
      console.error(
        `Error ${isEditing ? "updating" : "adding"} swimming pool:`,
        error,
      );
      toast.error(
        `Failed to ${isEditing ? "update" : "add"} swimming pool. Please try again.`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handlePoolSubmit} className="space-y-8">
        {/* Basic informations */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Pool Name *</label>
              <input
                type="text"
                name="name"
                value={poolFormData.name}
                onChange={handlePoolInputChange}
                className="input-field"
                placeholder="Enter pool name"
                required
              />
            </div>
            <div>
              <label className="label">City *</label>
              <select
                name="city"
                value={poolFormData.city}
                onChange={handlePoolInputChange}
                className="input-field"
                required
              >
                <option value="">Select City</option>
                <option value="Puttalam">Puttalam</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Location *</label>
              <input
                type="text"
                name="location"
                value={poolFormData.location}
                onChange={handlePoolInputChange}
                className="input-field"
                placeholder="Enter full address"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea
                name="description"
                value={poolFormData.description}
                onChange={handlePoolInputChange}
                rows={3}
                className="input-field"
                placeholder="Describe your swimming pool facilities"
              />
            </div>
          </div>
        </div>

        {/* Phones */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Contact Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Contact Phone *</label>
              <input
                type="tel"
                name="phone"
                value={poolFormData.phone}
                onChange={handlePoolInputChange}
                className="input-field"
                placeholder="Enter phone number"
                required
              />
            </div>
            <div>
              <label className="label">Secondary Phone</label>
              <input
                type="tel"
                name="secondaryPhone"
                value={poolFormData.secondaryPhone}
                onChange={handlePoolInputChange}
                className="input-field"
                placeholder="Enter secondary phone number"
              />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Bank Account Details
          </h2>
          <div className="space-y-6">
            <div className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Account Holder Name *</label>
                  <input
                    type="text"
                    name="bankAccountName"
                    value={poolFormData.bankAccountName}
                    onChange={handlePoolInputChange}
                    className="input-field"
                    placeholder="Enter account holder name"
                    required
                  />
                </div>
                <div>
                  <label className="label">Account Number *</label>
                  <input
                    type="text"
                    name="bankAccountNumber"
                    value={poolFormData.bankAccountNumber}
                    onChange={handlePoolInputChange}
                    className="input-field"
                    placeholder="Enter account number"
                    required
                  />
                </div>
                <div>
                  <label className="label">Bank Name *</label>
                  <input
                    type="text"
                    name="bankName"
                    value={poolFormData.bankName}
                    onChange={handlePoolInputChange}
                    className="input-field"
                    placeholder="Enter bank name"
                    required
                  />
                </div>
                <div>
                  <label className="label">Branch (Optional)</label>
                  <input
                    type="text"
                    name="bankBranch"
                    value={poolFormData.bankBranch}
                    onChange={handlePoolInputChange}
                    className="input-field"
                    placeholder="Enter branch name"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                These bank details will be sent to customers for advance payment
              </p>
            </div>
          </div>
        </div>

        {/* Shifts */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Shifts</h2>
            <button
              type="button"
              onClick={addShift}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Shift
            </button>
          </div>
          <div className="space-y-4">
            {poolFormData.shifts.map((shift, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="label">Start Time *</label>
                    <input
                      type="time"
                      value={shift.startTime}
                      onChange={(e) =>
                        handleShiftChange(index, "startTime", e.target.value)
                      }
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">End Time *</label>
                    <input
                      type="time"
                      value={shift.endTime}
                      onChange={(e) =>
                        handleShiftChange(index, "endTime", e.target.value)
                      }
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Max Capacity *</label>
                    <input
                      type="number"
                      value={shift.maxCapacity}
                      onChange={(e) =>
                        handleShiftChange(
                          index,
                          "maxCapacity",
                          parseInt(e.target.value),
                        )
                      }
                      className="input-field"
                      placeholder="Max people"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Price (LKR) *</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={shift.price}
                        onChange={(e) =>
                          handleShiftChange(index, "price", e.target.value)
                        }
                        className="input-field"
                        placeholder="Enter price"
                        min="0"
                        step="100"
                        required
                      />
                      {poolFormData.shifts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeShift(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Advance payments */}
          <div className="mt-5">
            <label className="label">Advance Payment Percentage *</label>
            <input
              type="number"
              name="advancePercentage"
              value={poolFormData.advancePercentage}
              onChange={handlePoolInputChange}
              className="input-field"
              placeholder="Enter percentage (e.g., 10, 20, 50)"
              min="0"
              max="100"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Percentage of total booking amount to be paid in advance
            </p>
            {poolFormData.advancePercentage &&
              poolFormData.shifts.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Advance Amount Calculation:
                  </p>
                  {poolFormData.shifts.map((shift, index) => {
                    const price = parseFloat(shift.price || "0");
                    const percentage = parseFloat(
                      poolFormData.advancePercentage || "0",
                    );
                    const advanceAmount = (price * percentage) / 100;
                    if (price > 0) {
                      return (
                        <p key={index} className="text-xs text-blue-700">
                          Shift {index + 1}: Rs.{price.toLocaleString()} ×{" "}
                          {percentage}% = Rs.{advanceAmount.toLocaleString()}
                        </p>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
          </div>
        </div>

        {/* Listing Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Listing Status
          </h2>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isListing"
              name="isListing"
              checked={poolFormData.isListing}
              onChange={handlePoolInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="isListing"
              className="text-sm font-medium text-gray-700"
            >
              Active Listing (Available for customer booking)
            </label>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {poolFormData.images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image}
                  alt={`Pool ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                type="button"
                onClick={() => setShowPhotoModal(true)}
                className="btn-primary flex items-center gap-2"
                disabled={uploadingImages}
              >
                <Camera className="h-4 w-4" />
                Take Photo
              </button>
              <button
                type="button"
                onClick={() => setShowPhotoModal(true)}
                className="btn-outline flex items-center gap-2"
                disabled={uploadingImages}
              >
                <Upload className="h-4 w-4" />
                Upload from Gallery
              </button>
            </div>
            {uploadingImages && (
              <div className="mt-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-xs text-gray-600 mt-1">
                  Processing image...
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading
              ? isEditing
                ? "Updating Pool..."
                : "Adding Pool..."
              : isEditing
                ? "Update Pool"
                : "Add Pool"}
          </button>
        </div>
      </form>

      <PhotoSelectionModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onPhotoTaken={handlePhotoTaken}
        onFileSelected={handleFileSelected}
      />

      <UploadProgressBar
        isVisible={showProgressBar}
        progress={uploadProgress}
        message={uploadMessage}
        onComplete={() => setShowProgressBar(false)}
      />
    </>
  );
}
