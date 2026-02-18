"use client";

import { useRouter } from "next/navigation";
import { Waves, Goal } from "lucide-react";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

const groundTypes = [
  {
    id: "futsal",
    name: "Futsal",
    icon: Goal,
    param: "futsal",
  },
  {
    id: "swimmingpool",
    name: "Swimming Pool",
    icon: Waves,
    param: "swimmingpool",
  },
];

export default function SelectGroundType() {
  const router = useRouter();

  const handleSelect = (type: string) => {
    router.push(`/admin/grounds/new?type=${type}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-12">
          What do you want to list?
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {groundTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card
                key={type.id}
                onClick={() => handleSelect(type.param)}
                className="p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-blue-500"
              >
                <Icon className="h-12 w-12 text-blue-600" />
                <span className="font-medium text-gray-900 text-center">
                  {type.name}
                </span>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
