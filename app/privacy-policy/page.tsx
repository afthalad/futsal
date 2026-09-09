import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy - Puttalam Grounds",
  description:
    "How Puttalam Grounds collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="4 September 2026">
      <p>
        This policy explains what information Puttalam Grounds collects when you
        use our website, why we collect it, and the choices you have.
      </p>

      <div>
        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Account and booking details</strong> — your name, phone
            number, and the grounds, dates, and time slots you book.
          </li>
          <li>
            <strong>Verification codes</strong> — we send a one-time code by SMS
            to confirm your phone number when you book or sign in.
          </li>
          <li>
            <strong>Ground owner details</strong> — if you list a venue, the
            venue information, photos, pricing, and payout details you provide.
          </li>
          <li>
            <strong>Usage data</strong> — basic analytics such as pages viewed
            and device or browser type, collected through Vercel Analytics.
          </li>
        </ul>
      </div>

      <div>
        <h2>How we use your information</h2>
        <ul>
          <li>To create and manage your bookings and account.</li>
          <li>
            To share your name and phone number with the ground owner so they
            can confirm or contact you about your booking.
          </li>
          <li>To send booking confirmations, reminders, and changes.</li>
          <li>To prevent fraud, misuse, and duplicate bookings.</li>
          <li>To improve the reliability and features of the platform.</li>
        </ul>
      </div>

      <div>
        <h2>Sharing</h2>
        <p>
          We do not sell your personal information. We share it only with the
          ground owner for the booking you made, and with the service providers
          that run the platform — including Google Firebase (hosting, database,
          and authentication), our SMS provider for verification messages, and
          Vercel for hosting and analytics. We may also disclose information
          where required by Sri Lankan law.
        </p>
      </div>

      <div>
        <h2>Advertising</h2>
        <p>
          We display advertisements through Google AdSense. Google and its
          partners may use cookies to serve ads based on your visits to this and
          other sites. You can manage this at{" "}
          <a
            href="https://adssettings.google.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Ads Settings
          </a>
          .
        </p>
      </div>

      <div>
        <h2>Data retention and security</h2>
        <p>
          Booking records are kept for as long as your account is active and for
          a reasonable period afterwards to handle disputes and meet
          record-keeping obligations. Passwords are stored hashed, and access to
          our systems is restricted to authorised administrators.
        </p>
      </div>

      <div>
        <h2>Your choices</h2>
        <ul>
          <li>
            You can view and update your profile details from your account page.
          </li>
          <li>
            You can ask us to delete your account and personal data, except
            records we must keep for completed bookings or legal reasons.
          </li>
          <li>
            You can stop receiving non-essential messages by contacting us.
            Booking confirmations and verification codes are required for the
            service to work.
          </li>
        </ul>
      </div>

      <div>
        <h2>Children</h2>
        <p>
          Our service is not intended for children under 16. A parent or
          guardian should make bookings on their behalf.
        </p>
      </div>

      <div>
        <h2>Changes</h2>
        <p>
          We may update this policy from time to time. The date at the top of
          this page shows when it was last changed.
        </p>
      </div>

      <div>
        <h2>Contact</h2>
        <p>
          For privacy questions or data requests, contact us at{" "}
          <a href="mailto:puttalamgrounds@gmail.com">
            puttalamgrounds@gmail.com
          </a>
          .
        </p>
      </div>
    </LegalPage>
  );
}
