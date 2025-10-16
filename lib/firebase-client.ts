import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore'
import { db } from './firebase'

// Types
export interface Ground {
  id: string;
  name: string;
  description: string | null;
  location: string;
  city: string;
  phone: string;
  secondaryPhone: string | null;
  images: string[];
  amenities: string[];
  morningPrice: number;
  eveningPrice: number;
  nightPrice: number;
  openingTime?: string;
  closingTime?: string;
  noClosingTime?: boolean;
  ownerId: string;
  isActive: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: any;
  owner: {
    name: string | null;
    phone: string;
  };
  bookings: {
    date: string;
    startTime: string;
    endTime: string;
    customerName: string;
    customerPhone: string;
    status?: string;
    reason?: string;
    cancellationReason?: string;
    cancelledAt?: any;
    cancelledBy?: string;
  }[];
}

export interface Booking {
  id: string;
  groundId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  reason?: string;
  cancellationReason?: string;
  cancelledAt?: any;
  cancelledBy?: string;
  createdAt: any;
  updatedAt: any;
}

/**
 * Fetch ground details with bookings using client-side Firebase
 * This replaces the API call with direct Firebase client calls
 */
export async function fetchGroundWithBookings(groundId: string): Promise<Ground | null> {
  try {
    // Fetch ground and bookings in parallel for better performance
    const [groundDoc, bookingsSnapshot] = await Promise.all([
      getDoc(doc(db, 'grounds', groundId)),
      getDocs(
        query(
          collection(db, 'bookings'),
          where('groundId', '==', groundId),
          where('status', '!=', 'CANCELLED'),
          orderBy('status'),
          orderBy('date', 'asc'),
          orderBy('startTime', 'asc')
        )
      )
    ])

    if (!groundDoc.exists()) {
      return null
    }

    const groundData = groundDoc.data()
    
    // Process bookings data
    const activeBookings = bookingsSnapshot.docs.map(doc => {
      const bookingData = doc.data()
      return {
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        customerName: bookingData.customerName,
        customerPhone: bookingData.customerPhone,
        status: bookingData.status,
        reason: bookingData.reason,
        cancellationReason: bookingData.cancellationReason,
        cancelledAt: bookingData.cancelledAt,
        cancelledBy: bookingData.cancelledBy
      }
    })

    // Process ground data with the same logic as the API
    const processedGround: Ground = {
      id: groundId,
      name: groundData.name,
      description: groundData.description || null,
      location: groundData.location,
      city: groundData.city,
      phone: groundData.phone,
      secondaryPhone: groundData.secondaryPhone || null,
      images: groundData.images || [],
      amenities: groundData.amenities || [],
      morningPrice: groundData.morningPrice,
      eveningPrice: groundData.eveningPrice,
      nightPrice: groundData.nightPrice,
      openingTime: groundData.openingTime,
      closingTime: groundData.closingTime,
      noClosingTime: groundData.noClosingTime,
      ownerId: groundData.ownerId,
      isActive: groundData.isActive,
      status: groundData.status || 'PENDING',
      rejectionReason: groundData.rejectionReason,
      reviewedBy: groundData.reviewedBy,
      reviewedAt: groundData.reviewedAt,
      owner: {
        name: 'Ground Owner', // We'll need to fetch this separately if needed
        phone: groundData.phone
      },
      bookings: activeBookings
    }

    return processedGround
  } catch (error) {
    console.error('Error fetching ground with bookings:', error)
    throw new Error('Failed to fetch ground details')
  }
}



/**
 * Helper function to process ground data consistently
 */
function processGroundData(groundId: string, groundData: any, bookingsData: any[]): Ground {
  const activeBookings = bookingsData.map(booking => ({
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    status: booking.status,
    reason: booking.reason,
    cancellationReason: booking.cancellationReason,
    cancelledAt: booking.cancelledAt,
    cancelledBy: booking.cancelledBy
  }))

  return {
    id: groundId,
    name: groundData.name,
    description: groundData.description || null,
    location: groundData.location,
    city: groundData.city,
    phone: groundData.phone,
    secondaryPhone: groundData.secondaryPhone || null,
    images: groundData.images || [],
    amenities: groundData.amenities || [],
    morningPrice: groundData.morningPrice,
    eveningPrice: groundData.eveningPrice,
    nightPrice: groundData.nightPrice,
    openingTime: groundData.openingTime,
    closingTime: groundData.closingTime,
    noClosingTime: groundData.noClosingTime,
    ownerId: groundData.ownerId,
    isActive: groundData.isActive,
    status: groundData.status || 'PENDING',
    rejectionReason: groundData.rejectionReason,
    reviewedBy: groundData.reviewedBy,
    reviewedAt: groundData.reviewedAt,
    owner: {
      name: 'Ground Owner',
      phone: groundData.phone
    },
    bookings: activeBookings
  }
}
