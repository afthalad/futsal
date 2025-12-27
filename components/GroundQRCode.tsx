"use client";

import { useState, useEffect } from "react";
import { QrCode, Download, Share2, Copy } from "lucide-react";
import QRCode from "qrcode";
import toast from "react-hot-toast";

interface GroundQRCodeProps {
  groundId: string;
  groundName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function GroundQRCode({
  groundId,
  groundName,
  isOpen,
  onClose,
}: GroundQRCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && groundId) {
      generateQRCode();
    }
  }, [isOpen, groundId]);

  const generateQRCode = async () => {
    setLoading(true);
    try {
      const groundUrl = `${window.location.origin}/grounds/${groundId}`;
      const qrCodeDataUrl = await QRCode.toDataURL(groundUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement("a");
      link.download = `${groundName.replace(/\s+/g, "_")}_QR_Code.png`;
      link.href = qrCodeUrl;
      link.click();
      toast.success("QR code downloaded!");
    }
  };

  const copyGroundUrl = () => {
    const groundUrl = `${window.location.origin}/grounds/${groundId}`;
    navigator.clipboard.writeText(groundUrl);
    toast.success("Ground URL copied to clipboard!");
  };

  const shareGround = async () => {
    const groundUrl = `${window.location.origin}/grounds/${groundId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${groundName} - Futsal Ground`,
          text: `Check out this futsal ground: ${groundName}`,
          url: groundUrl,
        });
      } catch (error) {}
    } else {
      copyGroundUrl();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <QrCode className="h-5 w-5 mr-2" />
            Share Ground
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="text-center mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            {groundName}
          </h4>
          <p className="text-xs text-gray-500 mb-4">
            Scan QR code to view ground details and book slots
          </p>

          {loading ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : qrCodeUrl ? (
            <div className="flex justify-center mb-4">
              <img
                src={qrCodeUrl}
                alt="Ground QR Code"
                className="border border-gray-200 rounded-lg"
              />
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <button
            onClick={downloadQRCode}
            disabled={!qrCodeUrl}
            className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Download QR Code
          </button>

          <button
            onClick={shareGround}
            className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Ground
          </button>

          <button
            onClick={copyGroundUrl}
            className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </button>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            Ground URL: <br />
            <span className="font-mono text-xs break-all">
              {typeof window !== "undefined"
                ? `${window.location.origin}/grounds/${groundId}`
                : ""}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
