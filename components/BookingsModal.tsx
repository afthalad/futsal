import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader as CardHead,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

export default function BookingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>My Bookings</DialogTitle>
        </DialogHeader>
        {dummyBookings.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No bookings found.
          </div>
        ) : (
          <div className="space-y-4">
            {dummyBookings.map((booking) => (
              <Card key={booking.id} className="w-full">
                <CardHead className="flex flex-row items-center justify-between">
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
                </CardHead>
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
      </DialogContent>
    </Dialog>
  );
}
