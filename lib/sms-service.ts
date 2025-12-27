// Free SMS Service for Sri Lanka
// Supports multiple providers for redundancy

// Import formatTime function for 12-hour time formatting
function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes}${ampm}`;
}

// Format time range for better display
function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

interface SMSProvider {
  name: string;
  sendSMS: (
    phone: string,
    message: string
  ) => Promise<{ success: boolean; error?: string }>;
}

// Text.lk - Sri Lankan SMS service
class TextLKProvider implements SMSProvider {
  name = "Text.lk";

  async sendSMS(
    phone: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Format phone number for Text.lk (remove + and use 94 prefix)
      const formattedPhone = phone.startsWith("+94")
        ? phone.substring(1)
        : phone.startsWith("94")
        ? phone
        : `94${phone.replace(/^0/, "")}`;

      // console.log(`Sending SMS to: ${formattedPhone}`);
      const response = await fetch("https://app.text.lk/api/v3/sms/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer 1497|lvTBGGijpjBgVE2Wg3o1NTi5MU2o7nlCsRnoDKjP45c491a0`,
        },
        body: JSON.stringify({
          recipient: formattedPhone,
          sender_id: "Px Grounds",
          type: "plain",
          message: message,
        }),
      });

      const data = await response.json();
      // console.log("SMS API Response:", data);

      if (response.ok && data.success) {
        return { success: true };
      } else {
        return { success: false, error: data.message || "Text.lk API error" };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// SMS Service Manager
class SMSService {
  private provider: SMSProvider;

  constructor() {
    this.provider = new TextLKProvider();
  }

  async sendSMS(
    phone: string,
    message: string
  ): Promise<{ success: boolean; error?: string; provider?: string }> {
    try {
      const result = await this.provider.sendSMS(phone, message);

      if (result.success) {
        return {
          success: true,
          provider: this.provider.name,
        };
      } else {
        return {
          success: false,
          error: result.error || "The SMS provider failed.",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error:
          error.message || "An unexpected error occurred while sending SMS.",
      };
    }
  }
}

// Export singleton instance
export const smsService = new SMSService();

// Export individual functions for easy use
export const sendSMS = (phone: string, message: string) =>
  smsService.sendSMS(phone, message);

// Specific functions for different types of messages
export const sendBookingNotification = async (
  phone: string,
  groundName: string,
  date: string,
  startTime: string,
  endTime: string
) => {
  const message = `🎉 NEW BOOKING REQUEST

Ground: ${groundName}
Date: ${new Date(date).toLocaleDateString("en-LK")}
Time: ${formatTimeRange(startTime, endTime)}

Please check your dashboard:
${process.env.NEXT_PUBLIC_APP_URL}/admin/bookings

- Puttalam Grounds`;
  return await sendSMS(phone, message);
};

export const sendBookingConfirmation = async (
  phone: string,
  groundName: string,
  date: string,
  startTime: string,
  endTime: string
) => {
  const message = `✅ BOOKING CONFIRMED

Ground: ${groundName}
Date: ${new Date(date).toLocaleDateString("en-LK")}
Time: ${formatTimeRange(startTime, endTime)}

Thank you for choosing our futsal ground!

- Puttalam Grounds`;
  return await sendSMS(phone, message);
};

export const sendBookingConfirmationToCustomer = async (
  phone: string,
  groundName: string,
  date: string,
  startTime: string,
  endTime: string,
  price: number
) => {
  const message = `✅ BOOKING CONFIRMED

Ground: ${groundName}
Date: ${new Date(date).toLocaleDateString("en-LK")}
Time: ${formatTimeRange(startTime, endTime)}
Price: Rs.${price.toLocaleString()}

Thank you for choosing our ground!

- ${groundName}`;
  return await sendSMS(phone, message);
};

// Ground: ${groundName}
export const sendBookingConfirmationToOwner = async (
  phone: string,
  groundName: string,
  date: string,
  startTime: string,
  endTime: string,
  customerName: string,
  customerPhone: string,
  price: number
) => {
  const message = `New Booking for ${groundName}:
Customer: ${customerName} ${customerPhone}
Time: ${formatTimeRange(startTime, endTime)}
Date: ${new Date(date).toLocaleDateString("en-LK")}
Price: Rs.${price}
See dashboard for details.`;

  return await sendSMS(phone, message);
};

export const sendBookingRejection = async (
  phone: string,
  groundName: string,
  date: string,
  startTime: string,
  endTime: string
) => {
  const message = `❌ BOOKING UNAVAILABLE

Ground: ${groundName}
Date: ${new Date(date).toLocaleDateString("en-LK")}
Time: ${formatTimeRange(startTime, endTime)}

Sorry, this time slot is not available.
Please try another time slot.

- Puttalam Grounds`;
  return await sendSMS(phone, message);
};

export const sendOTP = async (phone: string, otp: string) => {
  const message = `🔐 Your OTP code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`;
  return await sendSMS(phone, message);
};

export const sendBookingCancellationToCustomer = async (
  phone: string,
  customerName: string,
  groundName: string,
  date: string,
  startTime: string,
  endTime: string,
  reason: string
) => {
  const message = `❌ BOOKING CANCELLED

Dear ${customerName},

Your booking has been cancelled by Puttalam Grounds.

Booking Details:
Ground: ${groundName}
Date: ${new Date(date).toLocaleDateString("en-LK")}
Time: ${formatTimeRange(startTime, endTime)}

Reason: ${reason}

For assistance, contact us at 0773078103.

- Puttalam Grounds Team`;
  return await sendSMS(phone, message);
};

export const sendBookingCancellationToOwner = async (
  phone: string,
  groundName: string,
  customerName: string,
  customerPhone: string,
  date: string,
  startTime: string,
  endTime: string,
  reason: string
) => {
  const message = `❌ BOOKING CANCELLED

Dear Ground Owner,

A booking at your ground has been cancelled by Puttalam Grounds.

Booking Details:
Ground: ${groundName}
Customer: ${customerName}
Phone: ${customerPhone}
Date: ${new Date(date).toLocaleDateString("en-LK")}
Time: ${formatTimeRange(startTime, endTime)}

Reason: ${reason}

- Puttalam Grounds Team`;
  return await sendSMS(phone, message);
};

export const sendBookingCancellationToSuperAdmin = async (
  phone: string,
  groundName: string,
  customerName: string,
  customerPhone: string,
  date: string,
  startTime: string,
  endTime: string,
  reason: string,
  cancelledBy: string
) => {
  const cancelledByText =
    cancelledBy === "GROUND_OWNER" ? "Ground Owner" : "Puttalam Grounds";
  const message = `📋 BOOKING CANCELLATION NOTIFICATION

A booking has been cancelled by ${cancelledByText}.

Booking Details:
Ground: ${groundName}
Customer: ${customerName}
Phone: ${customerPhone}
Date: ${new Date(date).toLocaleDateString("en-LK")}
Time: ${formatTimeRange(startTime, endTime)}

Reason: ${reason}

Cancelled by: ${cancelledByText}

- Puttalam Grounds System`;
  return await sendSMS(phone, message);
};

export const sendGroundSubmissionSMS = async (
  phone: string,
  groundName: string
) => {
  const message = `🏟️ GROUND SUBMITTED FOR REVIEW

Dear Ground Owner,

Your ground "${groundName}" has been submitted for review.

Status: Under Review
Next Step: Our team will review your ground and notify you of the decision.

You will receive an SMS once the review is complete.

- Puttalam Grounds Team`;
  return await sendSMS(phone, message);
};

export const sendGroundApprovalSMS = async (
  phone: string,
  groundName: string
) => {
  const message = `✅ GROUND APPROVED

Dear Ground Owner,

Congratulations! Your ground "${groundName}" has been approved and is now live on our platform.

Status: Approved ✅
Your ground is now visible to customers and ready to receive bookings.

You can manage your ground and view bookings in your dashboard.

- Puttalam Grounds Team`;
  return await sendSMS(phone, message);
};

export const sendGroundRejectionSMS = async (
  phone: string,
  groundName: string,
  reason: string
) => {
  const message = `❌ GROUND REJECTED

Dear Ground Owner,

Unfortunately, your ground "${groundName}" has been rejected.

Status: Rejected ❌
Reason: ${reason}

You can submit a new ground application or contact us for more information.

For assistance, contact us at 0773078103.

- Puttalam Grounds Team`;
  return await sendSMS(phone, message);
};
