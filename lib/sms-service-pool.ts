function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes}${ampm}`;
}

function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

interface SMSProvider {
  name: string;
  sendSMS: (
    phone: string,
    message: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

class TextLKProvider implements SMSProvider {
  name = "Text.lk";

  async sendSMS(
    phone: string,
    message: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Format phone number for Text.lk (remove + and use 94 prefix)
      const formattedPhone = phone.startsWith("+94")
        ? phone.substring(1)
        : phone.startsWith("94")
          ? phone
          : `94${phone.replace(/^0/, "")}`;

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

class PoolSMSService {
  private provider: SMSProvider;

  constructor() {
    this.provider = new TextLKProvider();
  }

  async sendSMS(
    phone: string,
    message: string,
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
export const poolSMSService = new PoolSMSService();

/**
 * Send initial booking notification to customer
 */
export const sendPoolBookingNotification = async (
  phone: string,
  poolName: string,
  date: string,
  startTime: string,
  endTime: string,
  numberOfPeople: number,
) => {
  const message = `New Booking for ${poolName}:
Customer booking received
Time: ${formatTimeRange(startTime, endTime)}
Date: ${new Date(date).toLocaleDateString("en-LK")}
People: ${numberOfPeople}
Status: Waiting for advance payment
You will receive payment instructions shortly.
- ${poolName}`;
  return await poolSMSService.sendSMS(phone, message);
};

/**
 * Send advance payment request with owner account details
 */
export const sendPoolAdvancePaymentRequest = async (
  phone: string,
  customerName: string,
  poolName: string,
  date: string,
  ownerPhone: string,
  startTime: string,
  endTime: string,
  numberOfPeople: number,
  totalPrice: number,
  advanceAmount: number,
  ownerBankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    branch?: string;
  },
) => {
  const message = `ADVANCE PAYMENT REQUIRED 

Dear ${customerName},

Please pay the advance amount of Rs.${advanceAmount.toLocaleString()} and Send payment slip for confirmation.

Pool: ${poolName}
Date: ${new Date(date).toLocaleDateString("en-LK")}
Time: ${formatTimeRange(startTime, endTime)}
People: ${numberOfPeople}
Total: Rs.${totalPrice.toLocaleString()}
Advance: Rs.${advanceAmount.toLocaleString()}
Contact : ${ownerPhone}

PAYMENT DETAILS:
Bank: ${ownerBankDetails.bankName}${ownerBankDetails.branch ? ` ${ownerBankDetails.branch}` : ""}
Acc Name: ${ownerBankDetails.accountName}
Acc No: ${ownerBankDetails.accountNumber}


- Puttalam Grounds`;
  return await poolSMSService.sendSMS(phone, message);
};

/**
 * Send confirmation after advance payment received
 */
export const sendPoolAdvancePaidConfirmation = async (
  phone: string,
  customerName: string,
  poolName: string,
  date: string,
  startTime: string,
  endTime: string,
  numberOfPeople: number,
  balanceAmount: number,
  customerRules?: string,
  isOccassion?: boolean,
  maxCapacity?: number,
) => {
  let rulesSection = "";
  if (customerRules && customerRules.trim()) {
    rulesSection = `\nRULES:\n${customerRules}`;
  }

  let capacityWarning = "";
  // Add warning if not an occasion and exceeds capacity
  if (!isOccassion && maxCapacity && numberOfPeople > maxCapacity) {
    capacityWarning = `\n\n⚠️ NOTE: Your booking has ${numberOfPeople} people (capacity: ${maxCapacity}). Extra charges will apply for ${numberOfPeople - maxCapacity} additional people upon arrival.`;
  }

  const message = `ADVANCE PAYMENT CONFIRMED
Dear ${customerName},
Your advance payment received.
Pool: ${poolName}
Date: ${new Date(date).toLocaleDateString("en-LK")}
Time: ${formatTimeRange(startTime, endTime)}
People: ${numberOfPeople}
Balance to pay on arrival: Rs.${balanceAmount.toLocaleString()}${capacityWarning}${rulesSection}
See you soon!
- ${poolName}`;
  return await poolSMSService.sendSMS(phone, message);
};

/**
 * Send final booking confirmation
 */
export const sendPoolBookingConfirmed = async (
  phone: string,
  customerName: string,
  poolName: string,
  date: string,
  startTime: string,
  endTime: string,
  numberOfPeople: number,
  totalPrice: number,
  isOccassion: boolean,
  balanceAmount: number,
  ownerPhone: string,
  maxCapacity?: number,
) => {
  let capacityWarning = "";

  // Add warning if not an occasion and exceeds capacity
  if (!isOccassion && maxCapacity && numberOfPeople > maxCapacity) {
    capacityWarning = `\n\n⚠️ IMPORTANT: Your booking has ${numberOfPeople} people, which exceeds the standard capacity of ${maxCapacity}. Additional charges will apply for the extra ${numberOfPeople - maxCapacity} people.`;
  }

  // Add reminder about actual attendance vs booked
  let attendanceReminder = "";
  if (!isOccassion) {
    attendanceReminder = `\n\n📋 REMINDER: You have booked for ${numberOfPeople} people. If more people arrive than booked, additional charges will apply based on actual attendance.`;
  }

  const message = `BOOKING CONFIRMED

Dear ${customerName},
Your booking is confirmed.
Pool: ${poolName}
Date: ${new Date(date).toLocaleDateString("en-LK")}
Time: ${formatTimeRange(startTime, endTime)}
People: ${numberOfPeople}
Balance: Rs.${balanceAmount.toLocaleString()}
Total: Rs.${totalPrice.toLocaleString()}
Contact: ${ownerPhone}
${capacityWarning}${attendanceReminder}

Enjoy your swim!
- Puttalam Grounds`;
  return await poolSMSService.sendSMS(phone, message);
};

/**
 * Notify owner of new pool booking
 */
export const sendPoolBookingNotificationToOwner = async (
  phone: string,
  poolName: string,
  customerName: string,
  customerPhone: string,
  date: string,
  startTime: string,
  endTime: string,
  numberOfPeople: number,
  totalPrice: number,
) => {
  const message = `New Booking for ${poolName}:
Customer: ${customerName} ${customerPhone}
Time: ${formatTimeRange(startTime, endTime)}
Date: ${new Date(date).toLocaleDateString("en-LK")}
People: ${numberOfPeople}
Price: Rs.${totalPrice.toLocaleString()}
See dashboard for details.`;
  return await poolSMSService.sendSMS(phone, message);
};

/**
 * Send cancellation notification to customer
 */
export const sendPoolBookingCancellation = async (
  phone: string,
  customerName: string,
  poolName: string,
  date: string,
  startTime: string,
  endTime: string,
  reason: string,
) => {
  const message = `BOOKING CANCELLED

Dear ${customerName},
Your pool booking has been cancelled.

Pool: ${poolName}
Date: ${new Date(date).toLocaleDateString("en-LK")}
Time: ${formatTimeRange(startTime, endTime)}
Reason: ${reason}

- Puttalam Grounds`;
  return await poolSMSService.sendSMS(phone, message);
};

/**
 * Send status change notification to customer
 */
export const sendPoolStatusChangeNotification = async (
  phone: string,
  customerName: string,
  poolName: string,
  date: string,
  startTime: string,
  endTime: string,
  oldStatus: string,
  newStatus: string,
) => {
  const statusMessages: Record<string, string> = {
    WAITING_ADVANCE: "Waiting for advance payment",
    ADVANCE_PAID: "Advance payment received",
    CONFIRMED: "Booking confirmed",
  };

  const message = `BOOKING STATUS UPDATE
Dear ${customerName},
Pool: ${poolName}
Date: ${new Date(date).toLocaleDateString("en-LK")}
Time: ${formatTimeRange(startTime, endTime)}
Status: ${statusMessages[newStatus] || newStatus}
Thank you!
- ${poolName}`;
  return await poolSMSService.sendSMS(phone, message);
};
