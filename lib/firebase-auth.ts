import { auth } from "./firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";

const isBrowser = typeof window !== "undefined";

export const sendOTP = async (
  phoneNumber: string,
): Promise<{
  success: boolean;
  error?: string;
  confirmationResult?: ConfirmationResult;
}> => {
  try {
    if (!isBrowser) {
      return {
        success: false,
        error: "Phone authentication is only available in browser environment",
      };
    }

    const formattedPhone = phoneNumber.startsWith("+94")
      ? phoneNumber
      : `+94${phoneNumber.replace(/^0/, "")}`;

    // Clean up any existing reCAPTCHA containers
    const existingContainer = document.getElementById("recaptcha-container");
    if (existingContainer) {
      existingContainer.remove();
    }

    // Create fresh reCAPTCHA container
    const recaptchaContainer = document.createElement("div");
    recaptchaContainer.id = "recaptcha-container";
    recaptchaContainer.style.display = "none";
    document.body.appendChild(recaptchaContainer);

    // Initialize reCAPTCHA verifier
    const recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "invisible",
        callback: () => {},
        "expired-callback": () => {},
      },
    );

    try {
      // Render before using
      await recaptchaVerifier.render();

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifier,
      );

      return {
        success: true,
        confirmationResult,
      };
    } catch (e: any) {
      console.error("Firebase sendOTP failed", e);

      let errorMessage =
        "OTP service is temporarily unavailable. Please try again.";

      if (e?.code === "auth/too-many-requests") {
        errorMessage =
          "Too many OTP attempts. Please wait a few minutes and try again.";
      } else if (e?.code === "auth/invalid-phone-number") {
        errorMessage = "Invalid phone number. Please check and try again.";
      } else if (e?.code === "auth/captcha-check-failed") {
        errorMessage = "reCAPTCHA verification failed. Please try again.";
      }

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      // Clean up verifier and container immediately
      try {
        recaptchaVerifier.clear();
      } catch (e) {}

      const container = document.getElementById("recaptcha-container");
      if (container) container.remove();
    }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to send OTP" };
  }
};

export const verifyOTP = async (
  confirmationResult: ConfirmationResult,
  otp: string,
): Promise<{ success: boolean; error?: string; idToken?: string }> => {
  try {
    const result = await confirmationResult.confirm(otp);

    if (result.user) {
      const idToken = await result.user.getIdToken();
      return {
        success: true,
        idToken,
      };
    } else {
      return { success: false, error: "No user returned from verification" };
    }
  } catch (error: any) {
    let errorMessage = "Failed to verify OTP";

    if (
      error?.code === "auth/invalid-verification-code" ||
      error?.code === "auth/invalid-credential"
    ) {
      errorMessage = "Incorrect OTP. Please check and try again.";
    } else if (error?.code === "auth/code-expired") {
      errorMessage = "OTP has expired. Please request a new one.";
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

export const signOut = async () => {
  try {
    await auth.signOut();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const onAuthStateChanged = (callback: (user: any) => void) => {
  return auth.onAuthStateChanged(callback);
};
