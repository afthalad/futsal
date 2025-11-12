import { adminDb } from "./firebase-admin";

// Types
export interface User {
  id: string;
  phone: string;
  name?: string;
  role: "SUPER_ADMIN" | "GROUND_OWNER" | "USER";
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Ground {
  id: string;
  name: string;
  description?: string;
  location: string;
  city: string;
  phone: string;
  secondaryPhone?: string;
  images: string[];
  amenities: string[];
  morningPrice: number;
  eveningPrice: number;
  nightPrice: number;
  openingTime?: string;
  closingTime?: string;
  noClosingTime?: boolean;
  // Map of blocked maintenance slots keyed by date (YYYY-MM-DD) to array of slot strings
  blockedSlots?: Record<string, string[]>;
  isActive: boolean;
  ownerId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: any;
  createdAt: any;
  updatedAt: any;
}

export interface Booking {
  id: string;
  groundId: string;
  ownerId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  reason?: string;
  userId?: string;
  status?: string;
  cancellationReason?: string;
  isCommissionPaid?: boolean;
  cancelledAt?: any;
  cancelledBy?: string;
  createdAt: any;
  updatedAt: any;
}

// User operations
export const createUser = async (
  userData: Omit<User, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const docRef = await adminDb.collection("users").add({
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    // console.error('Error creating user in Firestore:', error)
    // Fallback to memory storage
    const { createUserInMemory } = await import("./memory-storage");
    return createUserInMemory(userData);
  }
};

export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const docRef = adminDb.collection("users").doc(id);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return null;
  } catch (error) {
    // console.error('Error getting user by ID from Firestore:', error)
    // Fallback to memory storage
    const { getUserByIdInMemory } = await import("./memory-storage");
    return getUserByIdInMemory(id);
  }
};

export const getUserByPhone = async (phone: string): Promise<User | null> => {
  try {
    const q = adminDb.collection("users").where("phone", "==", phone).limit(1);
    const querySnapshot = await q.get();

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as User;
    }
    return null;
  } catch (error) {
    // console.error('Error getting user by phone from Firestore:', error)
    // Fallback to memory storage
    const { getUserByPhoneInMemory } = await import("./memory-storage");
    return getUserByPhoneInMemory(phone);
  }
};

export const updateUser = async (
  id: string,
  updates: Partial<User>
): Promise<void> => {
  const docRef = adminDb.collection("users").doc(id);
  await docRef.update({
    ...updates,
    updatedAt: new Date(),
  });
};

// Ground operations
export const createGround = async (
  groundData: Omit<Ground, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const docRef = await adminDb.collection("grounds").add({
      ...groundData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    // console.error('Error creating ground in Firestore:', error)
    // Fallback to memory storage
    const { createGroundInMemory } = await import("./memory-storage");
    return createGroundInMemory(groundData);
  }
};

export const getGroundById = async (id: string): Promise<Ground | null> => {
  const docRef = adminDb.collection("grounds").doc(id);
  const docSnap = await docRef.get();

  if (docSnap.exists) {
    return { id: docSnap.id, ...docSnap.data() } as Ground;
  }
  return null;
};

// Simple in-memory cache for grounds
let groundsCache: Ground[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getAllGrounds = async (): Promise<Ground[]> => {
  try {
    // Check cache first
    const now = Date.now();
    if (groundsCache && now - cacheTimestamp < CACHE_DURATION) {
      return groundsCache;
    }

    // Get all grounds (both active and inactive)
    const q = adminDb.collection("grounds");
    const querySnapshot = await q.get();

    const grounds = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Set default status for existing grounds that don't have it
        status: data.status || "PENDING",
      };
    }) as Ground[];

    // Update cache
    groundsCache = grounds;
    cacheTimestamp = now;

    return grounds;
  } catch (error) {
    // console.error('Error getting all grounds from Firestore:', error)
    // Fallback to memory storage
    const { getAllGroundsInMemory } = await import("./memory-storage");
    return getAllGroundsInMemory();
  }
};

export const getAllGroundsWithOwnerInfo = async (): Promise<Ground[]> => {
  try {
    // Get all grounds
    const grounds = await getAllGrounds();

    // Get all ground owner IDs
    const ownerIds = Array.from(
      new Set(grounds.map((ground) => ground.ownerId))
    );

    // Fetch owner information for all owners
    const ownerPromises = ownerIds.map(async (ownerId) => {
      const user = await getUserById(ownerId);
      return { ownerId, user };
    });

    const ownerResults = await Promise.all(ownerPromises);
    const ownerMap = new Map(
      ownerResults.map(({ ownerId, user }) => [ownerId, user])
    );

    // Filter out grounds from disabled owners and add owner info
    const filteredGrounds = grounds
      .filter((ground) => {
        const owner = ownerMap.get(ground.ownerId);
        return owner && owner.isActive; // Only include grounds from active owners
      })
      .map((ground) => ({
        ...ground,
        owner: ownerMap.get(ground.ownerId),
      }));

    return filteredGrounds;
  } catch (error) {
    // console.error('Error getting grounds with owner info:', error)
    // Fallback to regular getAllGrounds
    return getAllGrounds();
  }
};

export const getGroundsByOwner = async (ownerId: string): Promise<Ground[]> => {
  try {
    const q = adminDb.collection("grounds").where("ownerId", "==", ownerId);
    const querySnapshot = await q.get();

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Set default status for existing grounds that don't have it
        status: data.status || "PENDING",
      };
    }) as Ground[];
  } catch (error) {
    // console.error('Error getting grounds by owner from Firestore:', error)
    // Fallback to memory storage
    const { getGroundsByOwnerInMemory } = await import("./memory-storage");
    return getGroundsByOwnerInMemory(ownerId);
  }
};

export const updateGround = async (
  id: string,
  data: Partial<Ground>
): Promise<void> => {
  try {
    await adminDb
      .collection("grounds")
      .doc(id)
      .update({
        ...data,
        updatedAt: new Date(),
      });

    // Update cache
    if (groundsCache) {
      const index = groundsCache.findIndex((g) => g.id === id);
      if (index !== -1) {
        groundsCache[index] = { ...groundsCache[index], ...data };
      }
    }
  } catch (error) {
    // console.error('Error updating ground in Firestore:', error)
    // Fallback to memory storage
    const { updateGroundInMemory } = await import("./memory-storage");
    updateGroundInMemory(id, data);
  }
};

export const deleteGround = async (id: string): Promise<void> => {
  try {
    await adminDb.collection("grounds").doc(id).delete();

    // Update cache
    if (groundsCache) {
      groundsCache = groundsCache.filter((g) => g.id !== id);
    }
  } catch (error) {
    // console.error('Error deleting ground from Firestore:', error)
    // Fallback to memory storage
    const { deleteGroundInMemory } = await import("./memory-storage");
    deleteGroundInMemory(id);
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  try {
    await adminDb.collection("users").doc(id).delete();
  } catch (error) {
    // console.error('Error deleting user from Firestore:', error)
    // Fallback to memory storage
    const { deleteUserInMemory } = await import("./memory-storage");
    deleteUserInMemory(id);
  }
};

// Booking operations
export const createBooking = async (
  bookingData: Omit<Booking, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const docRef = await adminDb.collection("bookings").add({
      ...bookingData,
      status: "BOOKED", // Set default status for new bookings
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    // console.error('Error creating booking in Firestore:', error)
    // Fallback to memory storage
    const { createBookingInMemory } = await import("./memory-storage");
    return createBookingInMemory(bookingData);
  }
};

export const getBookingById = async (id: string): Promise<Booking | null> => {
  try {
    const docRef = adminDb.collection("bookings").doc(id);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() } as Booking;
    }
    return null;
  } catch (error) {
    // console.error('Error getting booking from Firestore:', error)
    // Fallback to memory storage
    const { getBookingByIdInMemory } = await import("./memory-storage");
    return getBookingByIdInMemory(id) as Booking | null;
  }
};

export const getBookingsByGround = async (
  groundId: string
): Promise<Booking[]> => {
  const q = adminDb.collection("bookings").where("groundId", "==", groundId);
  const querySnapshot = await q.get();

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Booking[];
};

export const getBookingsByUser = async (userId: string): Promise<Booking[]> => {
  const q = adminDb.collection("bookings").where("userId", "==", userId);
  const querySnapshot = await q.get();

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Booking[];
};

export const getUnpaidBookingsByOwner = async (
  ownerId: string
): Promise<Booking[]> => {
  try {
    // Get yesterday's date in YYYY-MM-DD format
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Query for the owner's bookings
    const q = adminDb
      .collection("bookings")
      .where("ownerId", "==", ownerId)
      .where("date", "<=", yesterdayStr) // date is yesterday or earlier
      .where("status", "!=", "CANCELLED"); // status is not cancelled

    const querySnapshot = await q.get();

    // Filter in memory for isCommissionPaid == false since Firestore can't query multiple fields
    return querySnapshot.docs
      .map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Booking)
      )
      .filter((booking) => {
        const commissionPaid = booking.isCommissionPaid;
        return commissionPaid === false || commissionPaid === undefined;
      });
  } catch (error) {
    console.error("Error getting unpaid bookings:", error);
    return [];
  }
};

/**
 * Get all unpaid bookings up to yesterday and group them by ownerId.
 * Returns an object whose keys are ownerIds and values are arrays of Booking.
 */
export const getAllUnpaidBookingsUntilYesterdayGroupedByOwner =
  async (): Promise<Record<string, Booking[]>> => {
    try {
      // Yesterday in YYYY-MM-DD
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      // Query unpaid bookings up to yesterday
      const q = adminDb
        .collection("bookings")
        .where("isCommissionPaid", "==", false)
        .where("date", "<=", yesterdayStr);

      const querySnapshot = await q.get();

      const bookings: Booking[] = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Booking))
        // Filter out cancelled bookings
        .filter((b) => !(b.status && b.status.toUpperCase() === "CANCELLED"));

      // Group by ownerId
      const grouped: Record<string, Booking[]> = {};
      bookings.forEach((b) => {
        const ownerId = b.ownerId || "unknown";
        if (!grouped[ownerId]) grouped[ownerId] = [];
        grouped[ownerId].push(b);
      });

      // Optionally, sort bookings for each owner by date ascending
      Object.keys(grouped).forEach((ownerId) => {
        grouped[ownerId].sort((a, b) =>
          a.date < b.date ? -1 : a.date > b.date ? 1 : 0
        );
      });
      // console.log("Grouped", grouped);

      return grouped;
    } catch (error) {
      // console.error(
      //   "Error getting all unpaid bookings grouped by owner:",
      //   error
      // );
      return {};
    }
  };
export const getBookingsAfterDate = async (
  ownerId: string,
  afterDate?: string,
  beforeDate?: string
): Promise<Booking[]> => {
  // Simple query with just ownerId
  const q = adminDb.collection("bookings").where("ownerId", "==", ownerId);

  const querySnapshot = await q.get();

  // Filter in memory
  return querySnapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((booking: any) => {
      // Filter out cancelled bookings
      if (booking.status === "CANCELLED") return false;

      // Filter by date range
      if (afterDate && booking.date <= afterDate) return false;
      if (beforeDate && booking.date >= beforeDate) return false;

      return true;
    }) as Booking[];
};

export const getAllBookings = async (): Promise<Booking[]> => {
  const querySnapshot = await adminDb.collection("bookings").get();

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Booking[];
};

export const updateBooking = async (
  id: string,
  updates: Partial<Booking>
): Promise<void> => {
  try {
    const docRef = adminDb.collection("bookings").doc(id);
    await docRef.update({
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    // console.error('Error updating booking in Firestore:', error)
    // Fallback to memory storage
    const { updateBookingInMemory } = await import("./memory-storage");
    updateBookingInMemory(id, updates);
  }
};

// Commission management functions
export const updateCommissionAmount = async (
  ownerId: string,
  bookingAmount: number,
  operation: "add" | "subtract"
): Promise<void> => {
  try {
    const commissionRef = adminDb.collection("commission").doc(ownerId);
    const commissionDoc = await commissionRef.get();

    // Updated commission rates
    let commissionRate: number;
    let commissionAmount: number;

    if (ownerId === "eq9ywFOCOlqEkUBUaDeh") {
      commissionRate = 0.01; // 1% for this specific owner
      commissionAmount = bookingAmount * commissionRate;
    } else {
      commissionAmount = 50; // Fixed 50 rupees for others
    }

    // if (bookingAmount < 500) {
    //   commissionRate = 0.05; // 5% for bookings under 500
    // } else if (bookingAmount < 1000) {
    //   commissionRate = 0.03; // 3% for bookings 500-999
    // } else if (bookingAmount < 2000) {
    //   commissionRate = 0.02; // 2% for bookings 1000-1999
    // } else {
    //   commissionRate = 0.01; // 1% for bookings 2000 and above
    // }

    // const commissionAmount = bookingAmount * commissionRate;

    // const commissionAmount = bookingAmount * 0.01 // 1.5% commission

    if (commissionDoc.exists) {
      const currentData = commissionDoc.data();
      const currentAmount = currentData?.amount || 0;
      const newAmount =
        operation === "add"
          ? currentAmount + commissionAmount
          : Math.max(0, currentAmount - commissionAmount); // Don't go below 0

      await commissionRef.update({
        amount: newAmount,
        lastUpdated: new Date(),
        status: newAmount > 0 ? "PENDING" : "PAID",
      });
    } else {
      // Create new commission record
      await commissionRef.set({
        ownerId,
        amount: operation === "add" ? commissionAmount : 0,
        lastUpdated: new Date(),
        status: operation === "add" ? "PENDING" : "PAID",
      });
    }
  } catch (error) {
    // console.error('Error updating commission amount:', error)
    throw error;
  }
};

export const getUnpaidCommissionsByOwner = async (): Promise<
  Record<string, { totalCommission: number; bookings: Booking[] }>
> => {
  try {
    // Yesterday in YYYY-MM-DD
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Query unpaid bookings up to yesterday
    const q = adminDb
      .collection("bookings")
      .where("isCommissionPaid", "==", false)
      .where("date", "<=", yesterdayStr)
      .where("status", "==", "BOOKED");

    const querySnapshot = await q.get();

    const bookings: Booking[] = querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Booking)
    );

    // Group by ownerId and calculate commission
    const grouped: Record<
      string,
      { totalCommission: number; bookings: Booking[] }
    > = {};

    bookings.forEach((b) => {
      const ownerId = b.ownerId || "unknown";
      // Calculate commission based on owner ID
      let commission: number;
      if (ownerId === "eq9ywFOCOlqEkUBUaDeh") {
        commission = (b.price || 0) * 0.01; // 1% commission for specific owner
      } else {
        commission = 50; // Fixed 50 rupees for other owners
      }

      if (!grouped[ownerId]) {
        grouped[ownerId] = {
          totalCommission: 0,
          bookings: [],
        };
      }

      grouped[ownerId].totalCommission += commission;
      grouped[ownerId].bookings.push(b);
    });

    // Sort bookings for each owner by date ascending
    Object.keys(grouped).forEach((ownerId) => {
      grouped[ownerId].bookings.sort((a, b) =>
        a.date < b.date ? -1 : a.date > b.date ? 1 : 0
      );
      // Round commission to 2 decimal places
      grouped[ownerId].totalCommission =
        Math.round(grouped[ownerId].totalCommission * 100) / 100;
    });
    // console.log("Grouped", grouped);

    return grouped;
  } catch (error) {
    console.error("Error getting unpaid commissions by owner:", error);
    return {};
  }
};

/**
 * Calculate the total unpaid commission across all bookings where
 * isCommissionPaid == false and status == 'BOOKED'.
 * Returns { totalCommission, bookingsCount }.
 */
export const getTotalUnpaidCommissionFromBookings = async (): Promise<{
  totalCommission: number;
  bookingsCount: number;
}> => {
  try {
    const q = adminDb
      .collection("bookings")
      .where("isCommissionPaid", "==", false)
      .where("status", "==", "BOOKED");

    const snapshot = await q.get();

    let total = 0;
    let count = 0;

    snapshot.docs.forEach((doc) => {
      const data: any = doc.data();
      const price = Number(data.price || 0);
      const ownerId = data.ownerId || "";

      let commission = 0;
      // Keep same commission rules as getUnpaidCommissionsByOwner
      if (ownerId === "eq9ywFOCOlqEkUBUaDeh") {
        commission = price * 0.01; // 1% for specific owner
      } else {
        commission = 50; // flat for others
      }

      total += commission;
      count += 1;
    });

    return {
      totalCommission: Math.round(total * 100) / 100,
      bookingsCount: count,
    };
  } catch (error) {
    console.error("Error computing total unpaid commission:", error);
    return { totalCommission: 0, bookingsCount: 0 };
  }
};

export const getNoYesterdayLimitCommissionsByOwner = async (): Promise<
  Record<string, { totalCommission: number; bookings: Booking[] }>
> => {
  try {
    // Yesterday in YYYY-MM-DD
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Query unpaid bookings up to yesterday
    const q = adminDb
      .collection("bookings")
      .where("isCommissionPaid", "==", false)
      .where("date", "<=", yesterdayStr)
      .where("status", "==", "BOOKED");

    const querySnapshot = await q.get();

    const bookings: Booking[] = querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Booking)
    );

    // Group by ownerId and calculate commission
    const grouped: Record<
      string,
      { totalCommission: number; bookings: Booking[] }
    > = {};

    bookings.forEach((b) => {
      const ownerId = b.ownerId || "unknown";
      // Calculate commission based on owner ID
      let commission: number;
      if (ownerId === "eq9ywFOCOlqEkUBUaDeh") {
        commission = (b.price || 0) * 0.01; // 1% commission for specific owner
      } else {
        commission = 50; // Fixed 50 rupees for other owners
      }

      if (!grouped[ownerId]) {
        grouped[ownerId] = {
          totalCommission: 0,
          bookings: [],
        };
      }

      grouped[ownerId].totalCommission += commission;
      grouped[ownerId].bookings.push(b);
    });

    // Sort bookings for each owner by date ascending
    Object.keys(grouped).forEach((ownerId) => {
      grouped[ownerId].bookings.sort((a, b) =>
        a.date < b.date ? -1 : a.date > b.date ? 1 : 0
      );
      // Round commission to 2 decimal places
      grouped[ownerId].totalCommission =
        Math.round(grouped[ownerId].totalCommission * 100) / 100;
    });
    // console.log("Grouped", grouped);

    return grouped;
  } catch (error) {
    console.error("Error getting unpaid commissions by owner:", error);
    return {};
  }
};

export const getCommissionByOwner = async (ownerId: string): Promise<any> => {
  try {
    const commissionRef = adminDb.collection("commission").doc(ownerId);

    const commissionDoc = await commissionRef.get();

    if (commissionDoc.exists) {
      return { id: commissionDoc.id, ...commissionDoc.data() };
    }
    return null;
  } catch (error) {
    // console.error('Error getting commission:', error)
    return null;
  }
};

export const getPaymentsByOwner = async (ownerId: string): Promise<any[]> => {
  try {
    const q = adminDb
      .collection("payments")
      .where("ownerId", "==", ownerId)
      .orderBy("createdAt", "desc");

    const snapshot = await q.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting payments for owner:", error);
    return [];
  }
};

// export const markCommissionAsPaid = async (ownerId: string): Promise<void> => {
//   try {
//     // Get all unpaid bookings for this owner
//     const yesterday = new Date();
//     yesterday.setDate(yesterday.getDate() - 1);
//     const yesterdayStr = yesterday.toISOString().split("T")[0];

//     const q = adminDb
//       .collection("bookings")
//       .where("ownerId", "==", ownerId)
//       .where("isCommissionPaid", "==", false)
//       .where("date", "<=", yesterdayStr)
//       .where("status", "==", "BOOKED");

//     const querySnapshot = await q.get();

//     // Update all bookings in a batch
//     const batch = adminDb.batch();
//     querySnapshot.docs.forEach((doc) => {
//       batch.update(doc.ref, {
//         isCommissionPaid: true,
//         commissionPaidAt: new Date(),
//         updatedAt: new Date(),
//       });
//     });

//     // Also update the commission document
//     const commissionRef = adminDb.collection("commission").doc(ownerId);
//     batch.update(commissionRef, {
//       amount: 0,
//       status: "PAID",
//       paidAt: new Date(),
//       lastUpdated: new Date(),
//     });

//     // Commit all updates atomically
//     await batch.commit();
//   } catch (error) {
//     console.error("Error marking commission as paid:", error);
//     throw error;
//   }
// };
export const markCommissionAsPaid = async (
  ownerId: string,
  paidAmount: number,
  totalDue: number,
  paidDate: Date
): Promise<void> => {
  try {
    if (!ownerId) throw new Error("ownerId is required");

    // Convert paid date to string format for comparison
    const paidDateStr = paidDate.toISOString().split("T")[0];

    // Query unpaid bookings for the owner up to paidDate with status BOOKED
    const querySnapshot = await adminDb
      .collection("bookings")
      .where("ownerId", "==", ownerId)
      .where("date", "<", paidDateStr)
      .where("status", "==", "BOOKED")
      .where("isCommissionPaid", "==", false)
      .get();

    const batch = adminDb.batch();

    // Mark all unpaid bookings as paid
    querySnapshot.docs.forEach((doc) => {
      const ref = adminDb.collection("bookings").doc(doc.id);
      batch.update(ref, {
        isCommissionPaid: true,
        commissionPaidAt: paidDate,
        updatedAt: new Date(),
      });
    });

    // Calculate remaining amount
    const amountRemaining = Math.round((totalDue - paidAmount) * 100) / 100;

    // Create payment record
    const paymentsRef = adminDb.collection("payments").doc();
    batch.set(paymentsRef, {
      ownerId,
      amountPaid: Math.round(paidAmount * 100) / 100,
      totalDue: Math.round(totalDue * 100) / 100,
      amountRemaining,
      paidAt: paidDate,
      cutoffDate: paidDateStr,
      bookingsPaidCount: querySnapshot.docs.length,
      createdAt: new Date(),
    });

    // Commit all changes
    await batch.commit();

    console.log(
      `Marked ${querySnapshot.docs.length} bookings as paid for owner ${ownerId}`
    );
  } catch (error) {
    console.error("Error marking commission as paid:", error);
    throw error;
  }
};

export const deleteBooking = async (id: string): Promise<void> => {
  const docRef = adminDb.collection("bookings").doc(id);
  await docRef.delete();
};
export { adminDb };
