import Link from "next/link";
import Navbar from "@/components/Navbar";

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalPage({
  title,
  lastUpdated,
  children,
}: LegalPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-10">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Last updated: {lastUpdated}
        </p>

        <div className="mt-5 sm:mt-6 bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-5 text-sm sm:text-base text-gray-700 leading-relaxed [&_h2]:text-base [&_h2]:sm:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-primary-600 [&_a]:underline">
          {children}
        </div>

        <div className="mt-6 text-xs sm:text-sm text-gray-500">
          <Link href="/" className="text-primary-600 hover:underline">
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
