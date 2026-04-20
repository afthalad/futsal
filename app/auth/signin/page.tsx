"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Phone, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { initializeApp, getApps } from "firebase/app";
import {
  ConfirmationResult,
  RecaptchaVerifier,
  getAuth,
  onAuthStateChanged,
  signInWithPhoneNumber,
  signOut,
  User,
} from "firebase/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Step = "phone" | "code" | "done";

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

export default function SignInPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        router.push("/admin/dashboard");
      }
    });

    return () => {
      unsubscribe();
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, [router]);

  const normalizeToE164 = (rawPhone: string) => {
    const cleaned = rawPhone.replace(/\s|-/g, "");

    if (!cleaned) {
      return "";
    }

    if (cleaned.startsWith("+")) {
      return cleaned;
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
        setMessage("reCAPTCHA verified. Sending code...");
      },
      "expired-callback": () => {
        setMessage("reCAPTCHA expired. Please try again.");
      },
    });

    recaptchaVerifierRef.current = verifier;
    return verifier;
  };

  const handleSendCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formattedPhone = normalizeToE164(phone);

    if (!formattedPhone || !/^\+[1-9]\d{7,14}$/.test(formattedPhone)) {
      setMessage(
        "Enter a valid phone number in international format, e.g. +94771234567.",
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const appVerifier = ensureRecaptcha();
      await appVerifier.render();

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        appVerifier,
      );

      confirmationResultRef.current = confirmationResult;
      setPhone(formattedPhone);
      setStep("code");
      setMessage("Verification code sent. Check your SMS.");
    } catch (error: any) {
      if (recaptchaVerifierRef.current) {
        try {
          const widgetId = await recaptchaVerifierRef.current.render();
          if (typeof window !== "undefined" && (window as any).grecaptcha) {
            (window as any).grecaptcha.reset(widgetId);
          }
        } catch {
          // Keep UX simple if reset fails.
        }
      }

      setMessage(error?.message || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!confirmationResultRef.current) {
      setMessage("Request a verification code first.");
      setStep("phone");
      return;
    }

    if (!/^\d{6}$/.test(code.trim())) {
      setMessage("Enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await confirmationResultRef.current.confirm(code.trim());
      setMessage("Signed in successfully.");
      router.push("/admin/dashboard");
    } catch (error: any) {
      setMessage(error?.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setMessage("");

    try {
      await signOut(auth);
      confirmationResultRef.current = null;
      setCode("");
      setStep("phone");
      setMessage("Signed out.");
    } catch (error: any) {
      setMessage(error?.message || "Failed to sign out.");
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
            {step === "code" && "Verify Phone Number"}
            {step === "done" && "Signed In"}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            {step === "phone" && "Enter your phone number to get started"}
            {step === "code" &&
              "Enter the verification code sent to your phone"}
            {step === "done" && "You are signed in with Firebase Phone Auth"}
          </p>
        </div>

        <Card className="w-full">
          <CardContent className="p-4 sm:p-6">
            {(step === "phone" || step === "code") && (
              <form
                className="space-y-4 sm:space-y-6"
                onSubmit={step === "phone" ? handleSendCode : handleVerifyCode}
              >
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
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="Enter your phone number (e.g., +94771234567)"
                    disabled={loading || step === "code"}
                    className="w-full"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Enter your phone number in international format.
                  </p>
                </div>

                {step === "code" && (
                  <div className="space-y-2">
                    <label
                      htmlFor="code"
                      className="text-sm font-medium text-gray-700"
                    >
                      Verification Code
                    </label>
                    <Input
                      id="code"
                      type="text"
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      className="w-full text-center text-lg tracking-widest"
                      placeholder="000000"
                      maxLength={6}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Enter the 6-digit verification code sent to {phone}
                    </p>
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
                      : "Verify OTP"}
                </button>

                {step === "code" && (
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStep("phone");
                        setCode("");
                        setMessage("You can request a new code.");
                      }}
                      className="text-sm text-gray-600 hover:text-gray-800 p-0 h-auto"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                  </div>
                )}
              </form>
            )}

            {step === "done" && (
              <div className="space-y-4">
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  Signed in as {currentUser?.phoneNumber || "phone user"}.
                </div>
                <button
                  type="button"
                  className="w-full btn-primary"
                  onClick={handleSignOut}
                  disabled={loading}
                >
                  {loading ? "Signing out..." : "Sign Out"}
                </button>
              </div>
            )}

            {message && (
              <p className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                {message}
              </p>
            )}
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
