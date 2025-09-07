# Futsal Ground Booking System - Sri Lanka

A comprehensive futsal ground booking system built with Next.js, designed specifically for Sri Lanka. This system allows ground owners to list their futsal grounds and customers to easily book time slots.

## Features

### For Customers
- Browse available futsal grounds across Sri Lanka
- Search and filter grounds by location and name
- View detailed ground information with images and pricing
- Book time slots with simple form (name and phone number)
- Receive SMS confirmations for bookings

### For Ground Owners
- Phone-based authentication with OTP verification
- Add and manage multiple futsal grounds
- Upload multiple high-quality images per ground
- Set separate pricing for morning and evening slots
- Manage ground availability and time slots
- View and manage booking requests
- Receive SMS notifications for new bookings

### For Super Admin
- View all users, grounds, and bookings across the system
- Activate/deactivate users and grounds
- Monitor system statistics and revenue
- Full system control and management

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT with phone OTP
- **SMS**: Twilio integration
- **File Upload**: Multer for image handling

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Twilio account (for SMS functionality)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd futsal-booking-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

4. Update the `.env.local` file with your configuration:
```env
# Database
DATABASE_URL="file:./dev.db"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Twilio SMS (for Sri Lanka)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# File Upload
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE=5242880
```

5. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

6. Create a super admin user (optional):
```bash
npx prisma studio
```
Navigate to the User table and manually create a user with role "SUPER_ADMIN".

7. Start the development server:
```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── admin/         # Admin management endpoints
│   │   ├── bookings/      # Booking management endpoints
│   │   └── grounds/       # Ground management endpoints
│   ├── auth/              # Authentication pages
│   ├── admin/             # Admin dashboard pages
│   ├── grounds/           # Ground detail pages
│   └── globals.css        # Global styles
├── components/            # Reusable React components
├── lib/                   # Utility functions and configurations
│   ├── auth.ts           # Authentication helpers
│   ├── prisma.ts         # Database client
│   ├── sms.ts            # SMS functionality
│   └── utils.ts          # General utilities
├── prisma/               # Database schema and migrations
│   └── schema.prisma     # Database schema
└── public/               # Static assets
```

## Key Features Implementation

### Authentication System
- Phone number-based authentication
- OTP verification via SMS
- JWT token management
- Role-based access control (Super Admin, Ground Owner, User)

### Ground Management
- CRUD operations for grounds
- Image upload and storage
- Pricing management (morning/evening rates)
- Availability and time slot management

### Booking System
- Time slot selection with availability checking
- Simple booking form (name and phone)
- Booking status management (Pending, Accepted, Rejected, Booked)
- SMS notifications for all parties

### SMS Integration
- Twilio integration for Sri Lankan phone numbers
- OTP sending for authentication
- Booking notifications to ground owners
- Confirmation messages to customers

## Database Schema

### Users
- Phone-based authentication
- Role-based access (SUPER_ADMIN, GROUND_OWNER, USER)
- Profile information

### Grounds
- Ground details and location
- Pricing (morning/evening rates)
- Images and amenities
- Owner association

### Bookings
- Customer information
- Time slot details
- Status tracking
- Ground association

### OTP
- Temporary OTP storage
- Expiration handling

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP and login
- `GET /api/auth/me` - Get current user info

### Grounds
- `GET /api/grounds` - List all grounds (with search/filter)
- `POST /api/grounds` - Create new ground (Ground Owner)
- `GET /api/grounds/[id]` - Get ground details
- `PUT /api/grounds/[id]` - Update ground (Ground Owner)
- `DELETE /api/grounds/[id]` - Delete ground (Ground Owner)

### Bookings
- `GET /api/bookings` - List bookings (role-based)
- `POST /api/bookings` - Create new booking
- `PATCH /api/bookings/[id]/status` - Update booking status

### Admin
- `GET /api/admin/users` - List all users (Super Admin)
- `PATCH /api/admin/users/[id]/toggle` - Toggle user status
- `GET /api/admin/grounds` - List all grounds (Super Admin)
- `PATCH /api/admin/grounds/[id]/toggle` - Toggle ground status
- `GET /api/admin/bookings` - List all bookings (Super Admin)

## Deployment

### Environment Setup
1. Set up a production database (PostgreSQL recommended)
2. Configure Twilio credentials
3. Set up file storage (AWS S3 or similar)
4. Configure environment variables

### Build and Deploy
```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.

## Roadmap

- [ ] Payment integration
- [ ] Advanced booking calendar
- [ ] Email notifications
- [ ] Mobile app
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Ground rating and review system
