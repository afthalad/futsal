"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Phone, ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initializeApp, getApps } from "firebase/app";
import {
  ConfirmationResult,
  RecaptchaVerifier,
  getAuth,
  onAuthStateChanged,
  signInWithPhoneNumber,
} from "firebase/auth";

type LoginStep = "phone" | "otp" | "name";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

auth.useDeviceLanguage();

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>("phone");
  const [formData, setFormData] = useState({
    phone: "",
    otp: "",
    name: "",
  });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [otpSentTime, setOtpSentTime] = useState<number | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => {
      unsubscribe();
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const normalizeToE164 = (rawPhone: string) => {
    const cleaned = rawPhone.replace(/\s|-/g, "");

    if (!cleaned) {
      return "";
    }

    if (cleaned.startsWith("+")) {
      return cleaned;
    }

    if (cleaned.startsWith("0")) {
      return `+94${cleaned.slice(1)}`;
    }

    return `+${cleaned}`;
  };

  const ensureRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      return recaptchaVerifierRef.current;
    }

    const testMode =
      process.env.NEXT_PUBLIC_FIREBASE_PHONE_AUTH_TEST_MODE === "true";

    if (testMode) {
      auth.settings.appVerificationDisabledForTesting = true;
    }

    const verifier = new RecaptchaVerifier(auth, "send-code-button", {
      size: "invisible",
      callback: () => {
        toast.success("reCAPTCHA verified. Sending OTP...");
      },
      "expired-callback": () => {
        toast.error("reCAPTCHA expired. Please try again.");
      },
    });

    recaptchaVerifierRef.current = verifier;
    return verifier;
  };

  const verifyPhoneCode = async (code: string) => {
    if (!confirmationResult) {
      throw new Error("Request OTP first");
    }

    const result = await confirmationResult.confirm(code);
    return result.user.getIdToken();
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    setIdToken(null);
    setConfirmationResult(null);

    const formattedPhone = normalizeToE164(formData.phone);
    if (!formattedPhone || !/^\+[1-9]\d{7,14}$/.test(formattedPhone)) {
      toast.error("Please enter a valid phone number in international format");
      return;
    }

    setLoading(true);

    try {
      const appVerifier = ensureRecaptcha();
      await appVerifier.render();

      const result = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        appVerifier,
      );

      setConfirmationResult(result);
      setFormData({ ...formData, phone: formattedPhone });
      setStep("otp");
      setOtpSentTime(Date.now());
      setResendCooldown(30);
      toast.success("OTP sent to your phone number");
    } catch (error: any) {
      toast.error(error?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) {
      toast.error(`Please wait ${resendCooldown} seconds before resending`);
      return;
    }

    if (!formData.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    setResending(true);

    try {
      const formattedPhone = normalizeToE164(formData.phone);
      const appVerifier = ensureRecaptcha();
      await appVerifier.render();

      const result = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        appVerifier,
      );

      setConfirmationResult(result);
      setOtpSentTime(Date.now());
      setResendCooldown(30);
      setFormData({ ...formData, otp: "" });
      toast.success("New OTP sent to your phone number");
    } catch (error: any) {
      toast.error(error?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.otp.trim()) {
      toast.error("Please enter the OTP");
      return;
    }

    if (!confirmationResult) {
      toast.error("Please request OTP first");
      return;
    }

    setLoading(true);

    try {
      const idToken = await verifyPhoneCode(formData.otp);
      setIdToken(idToken);

      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: formData.phone,
          idToken,
          role: "GROUND_OWNER",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        toast.success("Login successful!");

        if (data.user?.role === "SUPER_ADMIN") {
          router.push("/admin/super");
        } else {
          router.push("/admin/dashboard");
        }
      } else {
        if (
          data.error === "Name is required for new users" ||
          data.error === "Name is required for existing users without profile"
        ) {
          toast.success("OTP verified! Please complete your profile");
          setStep("name");
        } else {
          toast.error(data.error || "Failed to verify OTP");
        }
      }
    } catch (error: any) {
      if (
        error?.message &&
        (error.message.includes("invalid-verification-code") ||
          error.message.includes("invalid-credential") ||
          error.message.includes("code-expired") ||
          error.message.includes("expired-action-code"))
      ) {
        toast.error("Incorrect OTP. Please check and try again.");
      } else {
        toast.error("Failed to verify OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!idToken) {
      toast.error("Please complete phone verification first");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: formData.phone,
          idToken: idToken,
          name: formData.name,
          role: "GROUND_OWNER",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        toast.success("Registration successful!");

        // Redirect based on user role
        if (data.user?.role === "SUPER_ADMIN") {
          router.push("/admin/super");
        } else {
          router.push("/admin/dashboard");
        }
      } else {
        toast.error(data.error || "Failed to complete registration");
      }
    } catch (error) {
      // console.error('Complete profile error:', error)
      toast.error("Failed to complete registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-4 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-2xl font-bold text-gray-900">
            {step === "phone" && "Join or Sign in as Ground Owner"}
            {step === "otp" && "Verify Phone Number"}
            {step === "name" && "Complete Profile"}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            {step === "phone" && "Enter your phone number to get started"}
            {step === "otp" && "Enter the verification code sent to your phone"}
            {step === "name" &&
              "Please provide your name to complete registration"}
          </p>
        </div>

        <Card className="w-full">
          <CardContent className="p-4 sm:p-6">
            <form
              className="space-y-4 sm:space-y-6"
              onSubmit={
                step === "phone"
                  ? handleSendOTP
                  : step === "otp"
                    ? handleVerifyOTP
                    : handleCompleteProfile
              }
            >
              {step === "phone" && (
                <div className="space-y-2">
                  <label
                    htmlFor="phone"
                    className="text-sm font-medium text-gray-700 flex items-center"
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Enter your phone number (e.g., 0771234567)"
                    className="w-full"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Enter your phone number (10 digits starting with 0)
                  </p>
                </div>
              )}

              {step === "otp" && (
                <div className="space-y-2">
                  <label
                    htmlFor="otp"
                    className="text-sm font-medium text-gray-700"
                  >
                    Verification Code
                  </label>
                  <Input
                    id="otp"
                    type="text"
                    value={formData.otp}
                    onChange={(e) =>
                      setFormData({ ...formData, otp: e.target.value })
                    }
                    className="w-full text-center text-lg tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Enter the 6-digit verification code sent to {formData.phone}
                  </p>
                  {/* {otpSentTime && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-blue-600">
                        OTP sent at {new Date(otpSentTime).toLocaleTimeString()}
                      </p>
                      
                    </div>
                  )} */}
                </div>
              )}

              {step === "name" && (
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-medium text-gray-700 flex items-center"
                  >
                    <User className="h-4 w-4 mr-1" />
                    Full Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter your full name"
                    className="w-full"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full btn-primary"
                disabled={loading}
              >
                {loading
                  ? "Processing..."
                  : step === "phone"
                    ? "Send OTP"
                    : step === "otp"
                      ? "Verify OTP"
                      : "Complete Registration"}
              </button>

              {step !== "phone" && (
                <div className="flex items-center justify-between pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStep(step === "otp" ? "phone" : "otp");
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800 p-0 h-auto"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>

                  {step === "otp" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResendOTP}
                      disabled={resending || resendCooldown > 0}
                      className={`text-sm p-0 h-auto ${
                        resendCooldown > 0
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-blue-600 hover:text-blue-800"
                      }`}
                    >
                      {resending
                        ? "Sending..."
                        : resendCooldown > 0
                          ? `Resend in ${resendCooldown}s`
                          : "Resend OTP"}
                    </Button>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <div className="mt-4 sm:mt-6 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-800">
            ← Back to Home
          </Link>
        </div>
      </div>

      <button
        id="send-code-button"
        type="button"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
