import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms & Conditions - Puttalam Grounds",
  description:
    "The terms that apply when you book or list a ground on Puttalam Grounds.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Business Terms & Conditions" lastUpdated="4 September 2026">
      <p>
        These terms apply to everyone who uses Puttalam Grounds — both players
        booking a slot and owners listing a venue. By using the platform you
        agree to them.
      </p>

      <div>
        <h2>1. What we do</h2>
        <p>
          Puttalam Grounds is a booking platform. We connect players with futsal
          grounds, sports venues, and swimming pools in Puttalam. The venue is
          owned and operated by the ground owner, not by us. We are not a party
          to the agreement between you and the ground owner.
        </p>
      </div>

      <div>
        <h2>2. Accounts</h2>
        <ul>
          <li>
            You must provide a valid phone number and accurate details when
            booking or registering.
          </li>
          <li>
            You are responsible for activity carried out under your account.
          </li>
          <li>
            We may suspend or remove accounts that provide false information,
            make repeated no-show bookings, or misuse the platform.
          </li>
        </ul>
      </div>

      <div>
        <h2>3. Bookings and payment</h2>
        <ul>
          <li>
            A booking is confirmed only once you receive a confirmation from the
            platform. Slots are allocated on a first-come basis.
          </li>
          <li>
            Prices are set by the ground owner and shown in Sri Lankan Rupees
            (LKR). Morning, evening, and night rates may differ.
          </li>
          <li>
            Payment may be collected online or at the venue, depending on the
            ground owner&apos;s arrangement.
          </li>
          <li>
            Payments are non-refundable if you cancel. Cancellations and
            refunds are governed by our{" "}
            <Link href="/return-policy">Return &amp; Refund Policy</Link>.
          </li>
        </ul>
      </div>

      <div>
        <h2>4. Using the venue</h2>
        <ul>
          <li>
            Arrive on time. Your slot ends at the booked time regardless of when
            you start.
          </li>
          <li>
            Follow the ground owner&apos;s rules on footwear, equipment, and
            conduct. Sports balls are not always provided — check with the
            ground before you arrive.
          </li>
          <li>
            You are responsible for any damage you or your group cause to the
            venue or its equipment.
          </li>
          <li>
            Play at your own risk. Neither the platform nor the ground owner is
            liable for injury, loss, or theft of personal belongings at the
            venue.
          </li>
        </ul>
      </div>

      <div>
        <h2>5. For ground owners</h2>
        <ul>
          <li>
            You must have the legal right to list and rent out the venue, and
            the listing details, photos, and prices must be accurate.
          </li>
          <li>
            You must honour confirmed bookings, and keep the venue safe, clean,
            and available for the booked slot.
          </li>
          <li>
            A platform commission applies to bookings made through Puttalam
            Grounds, at the rate agreed when you registered your venue.
          </li>
          <li>
            Where you cancel a confirmed booking, you are responsible for
            refunding the customer.
          </li>
        </ul>
      </div>

      <div>
        <h2>6. Acceptable use</h2>
        <p>
          Do not use the platform to make fake or speculative bookings, scrape
          or copy listings, upload unlawful or offensive content, or interfere
          with the security or operation of the service.
        </p>
      </div>

      <div>
        <h2>7. Availability and liability</h2>
        <p>
          We aim to keep the platform available at all times, but we do not
          guarantee uninterrupted service. To the extent permitted by law, our
          liability for any claim relating to a booking is limited to the amount
          you paid for that booking through the platform.
        </p>
      </div>

      <div>
        <h2>8. Changes and governing law</h2>
        <p>
          We may update these terms; continued use of the platform after a
          change means you accept the updated terms. These terms are governed by
          the laws of Sri Lanka.
        </p>
      </div>

      <div>
        <h2>9. Contact</h2>
        <p>
          Questions about these terms? Email us at{" "}
          <a href="mailto:puttalamgrounds@gmail.com">
            puttalamgrounds@gmail.com
          </a>
          .
        </p>
      </div>
    </LegalPage>
  );
}
