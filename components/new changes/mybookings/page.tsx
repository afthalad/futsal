"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Dummy bookings data
const dummyBookings = [
  {
    id: "1",
    ground: "Puttalam Main Ground",
    date: "2026-01-15",
    time: "18:00 - 19:00",
    status: "Confirmed",
    amount: 2500,
  },
  {
    id: "2",
    ground: "City Sports Arena",
    date: "2026-01-18",
    time: "20:00 - 21:00",
    status: "Pending",
    amount: 2000,
  },
  {
    id: "3",
    ground: "Beachside Turf",
    date: "2026-01-20",
    time: "17:00 - 18:00",
    status: "Cancelled",
    amount: 0,
  },
];

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState(dummyBookings);

  // In a real app, fetch bookings for the logged-in user here
  useEffect(() => {
    // fetchBookings().then(setBookings);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          My Bookings
        </h1>
        {bookings.length === 0 ? (
          <div className="text-center text-gray-500">No bookings found.</div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    {booking.ground}
                  </CardTitle>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      booking.status === "Confirmed"
                        ? "bg-green-100 text-green-700"
                        : booking.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {booking.status}
                  </span>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Date:</span> {booking.date}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Time:</span> {booking.time}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Amount:</span> Rs.{" "}
                      {booking.amount}
                    </div>
                    <Button size="sm" className="mt-2">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
