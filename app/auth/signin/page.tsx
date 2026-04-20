"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
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
        setStep("done");
      }
    });

    return () => {
      unsubscribe();
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

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
      setStep("done");
      setMessage("Signed in successfully.");
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
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
          <p className="mb-2 text-xs uppercase tracking-[0.28em] text-cyan-300">
            Firebase Client SDK
          </p>
          <h1 className="text-2xl font-semibold">Phone Sign In</h1>
          <p className="mt-2 text-sm text-slate-400">
            This page uses Firebase phone auth directly in the browser with
            reCAPTCHA. No API route is used.
          </p>

          <div className="mt-6 space-y-4">
            {(step === "phone" || step === "code") && (
              <form
                onSubmit={step === "phone" ? handleSendCode : handleVerifyCode}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label
                    htmlFor="phone"
                    className="block text-sm text-slate-300"
                  >
                    Phone Number (E.164)
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+94771234567"
                    disabled={loading || step === "code"}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-400 transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70"
                    required
                  />
                </div>

                {step === "code" && (
                  <div className="space-y-2">
                    <label
                      htmlFor="code"
                      className="block text-sm text-slate-300"
                    >
                      Verification Code
                    </label>
                    <input
                      id="code"
                      type="text"
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      inputMode="numeric"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm tracking-[0.25em] text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
                      required
                    />
                  </div>
                )}

                {step === "phone" && (
                  <button
                    id="send-code-button"
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? "Sending..." : "Send Verification Code"}
                  </button>
                )}

                {step === "code" && (
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loading ? "Verifying..." : "Verify Code"}
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setStep("phone");
                        setCode("");
                        setMessage("You can request a new code.");
                      }}
                      className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Back
                    </button>
                  </div>
                )}
              </form>
            )}

            {step === "done" && (
              <div className="space-y-4">
                <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                  Signed in as {currentUser?.phoneNumber || "phone user"}.
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Signing out..." : "Sign Out"}
                </button>
              </div>
            )}

            <div id="recaptcha-container" className="min-h-[8px]" />

            {message && (
              <p className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">
                {message}
              </p>
            )}
          </div>
        </div>

        <div className="text-center text-sm text-slate-400">
          <p>Use fictional test numbers in Firebase Console for development.</p>
          <Link
            href="/"
            className="mt-3 inline-block text-cyan-300 hover:text-cyan-200"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
