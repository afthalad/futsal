import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Return & Refund Policy - Puttalam Grounds",
  description:
    "Cancellation and refund rules for ground bookings made on Puttalam Grounds.",
};

export default function ReturnPolicyPage() {
  return (
    <LegalPage title="Return & Refund Policy" lastUpdated="4 September 2026">
      <p>
        Puttalam Grounds is a booking platform for sports grounds and swimming
        pools. We do not sell physical goods, so this policy covers the
        cancellation and refund of bookings made through our platform.
      </p>

      <div>
        <h2>Payments are non-refundable</h2>
        <p>
          <strong>
            Once a payment has been made, it is non-refundable if you cancel the
            booking.
          </strong>{" "}
          Your payment reserves the slot and blocks it from other customers, so
          the amount is not returned when the cancellation comes from your side.
          This applies no matter how far in advance you cancel, and it also
          applies if you do not turn up for the booked slot.
        </p>
      </div>

      <div>
        <h2>Cancelling a booking</h2>
        <ul>
          <li>
            You may cancel from your bookings page, or by contacting the ground
            owner using the phone number shown on the ground.
          </li>
          <li>
            Cancelling releases the slot for other customers, but does not
            entitle you to a refund of any amount already paid.
          </li>
          <li>
            A ground owner may, at their own discretion, allow you to reschedule
            to another available slot instead. This is a courtesy, not an
            entitlement.
          </li>
        </ul>
      </div>

      <div>
        <h2>When a refund is given</h2>
        <p>
          A refund is given only where the booking fails through no fault of
          yours, that is:
        </p>
        <ul>
          <li>The ground owner cancels your confirmed booking.</li>
          <li>
            The venue is unusable at the booked time because of maintenance,
            unsafe weather, or a facility problem.
          </li>
          <li>
            You were charged in error, or charged twice for the same booking.
          </li>
        </ul>
        <p>
          In those cases you may choose a full refund or a rescheduled slot of
          equal value.
        </p>
      </div>

      <div>
        <h2>How refunds are issued</h2>
        <ul>
          <li>
            Refunds are made using the same method you used to pay. Cash
            payments made directly at the ground are refunded by the ground
            owner.
          </li>
          <li>
            Approved refunds are usually processed within 7 business days. Banks
            may take a few additional days to show the amount.
          </li>
        </ul>
      </div>

      <div>
        <h2>Disputes</h2>
        <p>
          If you believe a refund is due and the ground owner disagrees, contact
          us with your booking reference and we will review the booking record
          and mediate.
        </p>
      </div>

      <div>
        <h2>Contact</h2>
        <p>
          For refund requests or questions about this policy, contact us at{" "}
          <a href="mailto:ahmatafthal@gmail.com">ahmatafthal@gmail.com</a>.
        </p>
      </div>
    </LegalPage>
  );
}
