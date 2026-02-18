"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Filter } from "lucide-react";
import Navbar from "@/components/Navbar";
import GroundCard from "@/components/GroundCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import toast from "react-hot-toast";

interface Ground {
  id: string;
  name: string;
  description: string | null;
  location: string;
  city: string;
  images: string[];
  morningPrice: number;
  eveningPrice: number;
  nightPrice: number;
  amenities: string[];
  isActive: boolean;
  phone: string;
  _count: {
    bookings: number;
  };
}

export default function HomePage() {
  const [grounds, setGrounds] = useState<Ground[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [suggestionValue, setSuggestionValue] = useState("");
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<
    { venue: string; count: number }[]
  >([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  useEffect(() => {
    // Initial load
    fetchGrounds();
  }, []);

  useEffect(() => {
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      if (search || selectedCity) {
        fetchGrounds();
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [search, selectedCity]);

  // Fetch suggestions only on mount and after a successful submit
  useEffect(() => {
    const fetchSuggestions = async () => {
      setSuggestionsLoading(true);
      try {
        const res = await fetch("/api/suggest-venue");
        const data = await res.json();
        if (Array.isArray(data.suggestions)) {
          // Count occurrences (case-insensitive, trimmed)
          const counts: Record<string, number> = {};
          data.suggestions.forEach((s: { venue: string }) => {
            const key = s.venue.trim().toLowerCase();
            if (key) counts[key] = (counts[key] || 0) + 1;
          });
          setSuggestions(
            Object.entries(counts)
              .map(([venue, count]) => ({ venue, count }))
              .sort(
                (a, b) => b.count - a.count || a.venue.localeCompare(b.venue),
              ),
          );
        }
      } catch (e) {
        // ignore
      } finally {
        setSuggestionsLoading(false);
      }
    };
    fetchSuggestions();
    // Only run on mount and after submit
    // eslint-disable-next-line
  }, [suggestionLoading]);

  const fetchGrounds = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCity) params.append("city", selectedCity);

      const response = await fetch(`/api/grounds?${params}`);
      const data = await response.json();

      if (response.ok) {
        setGrounds(data.grounds.filter((ground: Ground) => ground.isActive));

        // Extract unique cities
        const uniqueCities = Array.from(
          new Set(data.grounds.map((ground: Ground) => ground.city)),
        );
        setCities(uniqueCities as string[]);
      } else {
        toast.error("Failed to load grounds");
      }
    } catch (error) {
      console.error("Error fetching grounds:", error);
      toast.error("Failed to load grounds");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen ">
      <Navbar />

      {/* Hero Section */}

      {/* Grounds Section */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 lg:mb-6 gap-2">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            Available Grounds
            {grounds.length > 0 && (
              <span className="text-sm sm:text-base md:text-lg font-normal text-gray-600 ml-1 sm:ml-2">
                ({grounds.length} found)
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : grounds.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="text-gray-400 mb-4">
              <Filter className="h-12 w-12 sm:h-16 sm:w-16 mx-auto" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              No grounds found
            </h3>
            <p className="text-sm sm:text-base text-gray-600 px-4">
              {search || selectedCity
                ? "Try adjusting your search criteria"
                : "No grounds available at the moment"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {grounds.map((ground) => (
              <GroundCard key={ground.id} ground={ground} />
            ))}
          </div>
        )}
      </div>

      {/* Suggest Venue Section */}
      <div className="bg-white py-8 sm:py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="text-center mb-5 sm:mb-3 lg:mb-5">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900  sm:mb-4 ">
              Can't find your favourite venue?
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 mt-2  mb-2">
              Suggest us to add your favorite vanue!
            </p>
            <span className="text-xs sm:text-sm text-gray-400 ">
              ex: R4 Futsal, Zahira Ground, MC Badminton & Tennis, Zein Pool, DC
              Pool, Little Gym, 8Pool, Gaming Center, Etc..
            </span>
          </div>
          <form
            className="flex flex-row items-center gap-3 sm:gap-4 justify-center flex-wrap"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!suggestionValue.trim()) {
                toast.error("Please enter a venue name");
                return;
              }
              setSuggestionLoading(true);
              try {
                // You can replace this with an API call or email integration
                await fetch("/api/suggest-venue", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ venue: suggestionValue.trim() }),
                });
                toast.success("Thank you for your suggestion!");
                setSuggestionValue("");
              } catch (err) {
                toast.error("Failed to send suggestion");
              } finally {
                setSuggestionLoading(false);
              }
            }}
          >
            <input
              type="text"
              className="w-full max-w-xs flex-1 border border-gray-300 rounded-md px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter venue name..."
              value={suggestionValue}
              onChange={(e) => setSuggestionValue(e.target.value)}
              disabled={suggestionLoading}
              maxLength={60}
              required
            />
            <button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2 rounded-md transition disabled:opacity-60 whitespace-nowrap"
              disabled={suggestionLoading}
            >
              {suggestionLoading ? "Sending..." : "Suggest"}
            </button>
          </form>

          {/* Suggestions List */}
          <div className="mt-6">
            {suggestionsLoading ? (
              <>
                {/* <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Suggested Venues
                </h4>
                <div className="text-gray-400 text-sm">Loading...</div> */}
              </>
            ) : suggestions.length === 0 ? (
              <></>
            ) : (
              <>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Suggested Venues
                </h4>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <span
                      key={s.venue}
                      className="inline-flex items-center bg-gray-100 border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-700 font-medium"
                    >
                      {s.venue.charAt(0).toUpperCase() + s.venue.slice(1)}
                      <span className="ml-2 bg-primary-600 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                        {s.count}
                      </span>
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      {/* <div className="bg-white py-4 sm:py-6 lg:py-8">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="text-center mb-3">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1">
              Why Choose Puttalam Grounds?
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">
              The easiest way to book grounds in Puttalam
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0">
            <div className="flex-1 flex flex-col items-center px-2">
              <div className="bg-primary-100 w-8 h-8 rounded-full flex items-center justify-center mb-2">
                <MapPin className="h-4 w-4 text-primary-600" />
              </div>
              <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 mb-1">
                Across Puttalam
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 text-center">
                Find grounds across puttalam in few clicks
              </p>
            </div>
            <div className="hidden sm:block h-12 border-l border-gray-200 mx-2"></div>
            <div className="flex-1 flex flex-col items-center px-2">
              <div className="bg-primary-100 w-8 h-8 rounded-full flex items-center justify-center mb-2">
                <Search className="h-4 w-4 text-primary-600" />
              </div>
              <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 mb-1">
                Easy Booking
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 text-center">
                Simple and quick booking process
              </p>
            </div>
            <div className="hidden sm:block h-12 border-l border-gray-200 mx-2"></div>
            <div className="flex-1 flex flex-col items-center px-2">
              <div className="bg-primary-100 w-8 h-8 rounded-full flex items-center justify-center mb-2">
                <Filter className="h-4 w-4 text-primary-600" />
              </div>
              <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 mb-1">
                Best Prices
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 text-center">
                Competitive morning and evening pricing rates
              </p>
            </div>
          </div>
        </div>
      </div> */}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-4 sm:py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 text-center">
          <h3 className="text-base sm:text-lg md:text-xl font-medium text-gray-400 mb-1 sm:mb-2">
            Made with ❤️ for puttalam
          </h3>
          <p className="text-xs sm:text-sm md:text-base text-gray-400">
            Book grounds across puttalam with ease
          </p>
        </div>
      </footer>

      {/* Performance Monitor (Development Only) */}
      {/* <PerformanceMonitor /> */}
    </div>
  );
}

// update favicon
// check url across check
// check sms text.lk

// show the pool only to that owner to make bool in dashboard or in home
// better shows a button in dashobard if typeswimmingpool vanue avaiable for the owner and trgiger the form
