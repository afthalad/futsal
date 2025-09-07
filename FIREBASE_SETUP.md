# Firebase Setup Guide

Your Firebase project is already configured with the following credentials:

## Project Details
- **Project ID**: `uplifted-block-469516-k4`
- **Project Name**: Uplifted Block
- **Region**: Default (us-central1)

## Environment Variables

Copy the following to your `.env.local` file:

```env
# Firebase Configuration (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyDMQwD81dNg7HAUtoRw3I5RLlPzvZ0Fqzw"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="uplifted-block-469516-k4.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="uplifted-block-469516-k4"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="uplifted-block-469516-k4.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="863809833573"
NEXT_PUBLIC_FIREBASE_APP_ID="1:863809833573:web:c9bdae89f59fe7e7d4548c"

# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID="uplifted-block-469516-k4"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@uplifted-block-469516-k4.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDhUGakxM5qrn5+\n7ljKYZ5eBZya1VZbQlm0glTOXQHs0srRJy1mgOJ+QXTxpWCM3J56vcNzpKMBtrtA\nH2BvrNDOqpqALCbmIEoMqsueBJCKPIV+5PVAwxcDQcMiR4OuMwdxfep/EccDSiL9\nO313NI27Whh+duJe5GzlW2LUtdJ4lRnYvT+ovEzR/1ErTyYdvG4PeDnDovIX1XhR\nYEXeDXneOD/xIpHTJUOCRGlHbFNlEpaSr8pnvPYaY0jeygihuQGFphGbRcdGJoHN\nbWegmvoBuSrnqjdlEAJ18n2d/aaMTR/R9ldv09F2ZbehWYzjatEtCHsNkXN/bYTK\n/9dk0qtvAgMBAAECggEARoXk6tPTDB875rzxu77cU++LugbmdcAJ1e8pXkJMVPUR\nmG+bzUawHfadBPnPg6eWTzLQV4UDpIiuiX6Ir8u2u8k4fL/VGRioNNjMzNP+7dXN\nrw85GKE3tcRCsJsTw1WjkclouYc19HijBQI23jXr2uVzXzoU1sDGuO9mus+CZk0m\nXS88H5KukNkGAGKWKDQ8oSJElEK7fSuPnCsGhA1Mb+n3p6/yPl/WJsmOQ8uYFbBm\nlNhtLenCkywrpPq7yMjp9p861pWITUHDVGEMfufRfdt5nmyoiKisdas1tWigPx02\nHlheejpNxFHgLCJRdPAvucB0n4Xh+wsA+AK1HzWyuQKBgQD/bIfUA5A2GOtqK7mb\nSBiI5o4KYxflHVnNFbG7rGM/Pqd4jfjOvvkAU3TKiCjmO/MdrOW61BpB6YEKBJTk\nRFiik5dSdaIuAFhfBWnfxmQU5MOMsmBgXzESzluruBpPMWie4dn4RNdT1HWGuHzd\nWSCbbI6rkEOGxjs6h0fbslC3iwKBgQDh0nyDu9nB1zJkgOfqUh9JMaoaupG31FGm\n3lln7FqdGXbNFR5uX7AOVdB31JfhG5azpl3MJ/W2yaDaaY8zLAKAEq14//hZ4KFD\nahkPX0I1kzTyj51LIcLEfrJYiSu3Z03rHCJAgoXhxqIytOPBIjZIpa3iaMTG4qRx\nid9H3PQ4LQKBgQCNHPnBsSJIMOZGpteJKYCcibupk2uNIfUN79FcnPXL6CJ/4Pe3\nyRwqCPF6P1VRNYewOmhFGo9TIN0wmq1jmzrYvu+YF/M8tOYdwRDoF2QNgwFiRt4m\nABFNkYJl0XV/kQ160c4pcmcAIl23y074vxfbplMAB9i2qefpAvo5Lz+W1wKBgGhW\nIEGdYZc2HophJMYW+22ODNIcsYcGClPXF+f0REmhokpPH6hPfcCh1ZgIGcRgQtju\nXRgevmCd+Dvx2cAC7YTPHGdznQOpzdigBMQddzHZufT4dexoxNyUzUIq3o/2owGm\nFg1IQSN36ykSesiZTgtywUyCq6hYvzHWSduiMxRhAoGAcrtpwRQWFRG8z7Y1BIbO\nmRf9udl7QlS1PeB2in85ZqC9Ok+sHfOru+tqMDAajscjzynkTVo2OhGJ1cllaqam\n55MDaKMP5eh4w8wlazm9+fAFkDBHFYc0XMfXw9aBddX0XYCP64k2stUtxSYl8lcv\nlVbgKXXm2mf/R5ANE2y/Eqc=\n-----END PRIVATE KEY-----\n"

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# SMS Configuration (Text.lk)
SMS_API_KEY=your_text_lk_api_key
SMS_SENDER_ID=your_sender_id
```

## Firebase Console Setup

### 1. Enable Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/project/uplifted-block-469516-k4)
2. Navigate to **Authentication** > **Sign-in method**
3. Enable **Phone** provider
4. Add your phone number as a test number (optional for development)

### 2. Set Up Firestore Database
1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location (choose closest to your users)

### 3. Set Up Storage
1. Go to **Storage**
2. Click **Get started**
3. Choose **Start in test mode**
4. Select the same location as Firestore

### 4. Create Collections
The app will automatically create the following collections when first used:
- `users` - User accounts and profiles
- `grounds` - Futsal ground listings
- `bookings` - Booking records

## Database Schema

### Users Collection
```javascript
{
  id: "auto-generated",
  phone: "+94773078103",
  name: "User Name",
  role: "SUPER_ADMIN" | "GROUND_OWNER" | "USER",
  isActive: true,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Grounds Collection
```javascript
{
  id: "auto-generated",
  name: "Ground Name",
  description: "Ground description",
  location: "Address",
  city: "City",
  phone: "+94773078103",
  email: "email@example.com",
  images: ["url1", "url2"],
  amenities: ["parking", "changing_room"],
  morningPrice: 5000,
  eveningPrice: 7000,
  isActive: true,
  openingTime: "06:00",
  closingTime: "22:00",
  ownerId: "user_id",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Bookings Collection
```javascript
{
  id: "auto-generated",
  groundId: "ground_id",
  customerName: "Customer Name",
  customerPhone: "+94773078103",
  date: "2024-01-15",
  startTime: "10:00",
  endTime: "11:00",
  price: 5000,
  reason: "Birthday party",
  userId: "user_id",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Security Rules

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Anyone can read active grounds
    match /grounds/{groundId} {
      allow read: if resource.data.isActive == true;
      allow write: if request.auth != null;
    }
    
    // Users can create bookings, read their own bookings
    match /bookings/{bookingId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         request.auth.token.role == 'GROUND_OWNER' ||
         request.auth.token.role == 'SUPER_ADMIN');
    }
  }
}
```

### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /grounds/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Testing the Setup

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test phone authentication**:
   - Go to `/auth/login`
   - Enter your phone number
   - Check Firebase Console > Authentication for the OTP

3. **Test database operations**:
   - Create a ground
   - Make a booking
   - Check Firestore Console for the data

4. **Test storage**:
   - Upload a ground image
   - Check Storage Console for the file

## Super Admin Setup

The super admin user (0773078103) will be automatically created when you first log in with that number. You can also manually create it by running:

```bash
npm run setup-admin
```

## Troubleshooting

### Common Issues:

1. **"Firebase App not initialized"**: Check your environment variables
2. **"Permission denied"**: Update Firestore security rules
3. **"Invalid phone number"**: Ensure phone numbers start with +94
4. **"OTP not received"**: Check Firebase Console > Authentication > Usage

### Useful Commands:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Check Firebase connection
npm run test-firebase
```

## Production Considerations

1. **Security Rules**: Update Firestore and Storage rules for production
2. **Phone Authentication**: Set up production SMS provider
3. **Database**: Switch from test mode to production mode
4. **Monitoring**: Enable Firebase Analytics and Performance Monitoring
5. **Backup**: Set up automated backups

Your Firebase project is now ready to use! 🚀