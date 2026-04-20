"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check if we're on the client side
      if (typeof window === "undefined") {
        setIsCheckingAuth(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/signin");
        return;
      }

      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        localStorage.removeItem("token");
        router.push("/auth/signin");
        return;
      }

      const data = await response.json();
      if (
        data.user.role !== "GROUND_OWNER" &&
        data.user.role !== "SUPER_ADMIN"
      ) {
        router.push("/");
        return;
      }

      // Authentication successful
      setIsAuthenticated(true);
    } catch (error) {
      router.push("/auth/signin");
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="flex items-center justify-center mb-2">
            <User className="h-6 w-6 text-blue-600 mr-2" />
            <p className="text-lg font-semibold text-gray-900">
              Admin Dashboard
            </p>
          </div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show nothing if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
