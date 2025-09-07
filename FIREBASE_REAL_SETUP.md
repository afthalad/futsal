# Firebase Real Phone Authentication Setup Guide

This guide will help you set up **real phone authentication** with Firebase and migrate from Prisma to Firestore for your Futsal Booking System.

## 🚀 What You'll Get

- **Real SMS delivery** to actual phone numbers
- **Free tier**: 10,000 phone verifications per month
- **Firestore database** instead of Prisma/SQLite
- **Production-ready** authentication system
- **Sri Lankan phone number** support

## 📋 Prerequisites

1. Google account
2. Node.js and npm installed
3. Your Next.js project running

## 🔧 Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `futsal-booking-system` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

## 🔧 Step 2: Enable Phone Authentication

1. In your Firebase project, go to **Authentication** → **Sign-in method**
2. Click on **Phone** provider
3. Toggle **Enable** to ON
4. Click **Save**

## 🔧 Step 3: Set Up Firestore Database

1. Go to **Firestore Database** in your Firebase project
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location (choose closest to Sri Lanka)
5. Click **Done**

## 🔧 Step 4: Get Firebase Configuration

### Client-side Configuration

1. Go to **Project Settings** (gear icon) → **General** tab
2. Scroll down to "Your apps" section
3. Click **Add app** → **Web** (</> icon)
4. Register your app with nickname: `futsal-web`
5. Copy the Firebase configuration object

### Server-side Configuration (Firebase Admin)

1. Go to **Project Settings** → **Service accounts** tab
2. Click **Generate new private key**
3. Download the JSON file (keep it secure!)
4. Extract the values from the JSON file

## 🔧 Step 5: Add Test Phone Numbers

### For Development Testing:

1. Go to **Authentication** → **Users** tab
2. Click **Add user**
3. Add test phone numbers in format: `+94771234567`
4. These numbers will receive real SMS messages

### For Production:

- Users will register with their real phone numbers
- Firebase will send SMS automatically
- No need to pre-add phone numbers

## 🔧 Step 6: Update Environment Variables

Create a `.env.local` file in your project root:

```env
# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# File Upload
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE=5242880

# Firebase Configuration (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef123456"

# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

## 🔧 Step 7: Install Dependencies

```bash
npm install firebase firebase-admin
```

## 🔧 Step 8: Test the Integration

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to login page:**
   ```
   http://localhost:3000/auth/login
   ```

3. **Enter a real Sri Lankan phone number:**
   - Format: `0771234567` or `94771234567`
   - Click "Send OTP"

4. **Check your phone for SMS:**
   - You should receive a real SMS with verification code
   - Enter the code to complete authentication

## 🔧 Step 9: Configure reCAPTCHA (Production)

For production, you need to configure reCAPTCHA:

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Create a new site with:
   - **Label**: Futsal Booking System
   - **reCAPTCHA type**: reCAPTCHA v2
   - **Domains**: your-domain.com, localhost (for development)
3. Get your Site Key and Secret Key
4. Update your Firebase project settings with the reCAPTCHA keys

## 📱 How It Works Now

### Frontend Flow:
1. User enters phone number
2. Firebase sends **real SMS** with verification code
3. User enters the code from their phone
4. Firebase verifies the code and returns an ID token
5. Backend verifies the ID token and creates/authenticates user in Firestore

### Backend Flow:
1. Receives phone number and Firebase ID token
2. Verifies the Firebase ID token
3. Creates or finds user in Firestore
4. Returns JWT token for app authentication

## 🗄️ Firestore Collections

Your data will be stored in these Firestore collections:

- **users**: User accounts and profiles
- **grounds**: Futsal ground listings
- **bookings**: Booking requests and confirmations

## 🚨 Important Notes

### Security:
- Keep your Firebase private key secure
- Never commit `.env.local` to version control
- Use environment variables in production

### Phone Number Format:
- Sri Lankan numbers should be in format: `+94XXXXXXXXX`
- The app automatically converts `0XXXXXXXXX` to `+94XXXXXXXXX`

### Development vs Production:
- In development, verification links are logged to console
- In production, SMS will be sent directly to the phone
- reCAPTCHA is required for production

## 🔧 Troubleshooting

### Common Issues:

1. **"reCAPTCHA not initialized"**
   - Make sure the reCAPTCHA container div exists
   - Check browser console for errors

2. **"Invalid phone number format"**
   - Ensure phone number starts with 0 or 94
   - Check the phone number validation regex

3. **"Firebase configuration error"**
   - Verify all environment variables are set correctly
   - Check that Firebase project is properly configured

4. **"SMS not received"**
   - Check if phone authentication is enabled in Firebase
   - Verify phone number format
   - Check Firebase quotas and billing

5. **"Firestore permission denied"**
   - Check Firestore security rules
   - Ensure proper authentication

### Debug Mode:
- Check browser console for detailed error messages
- Firebase provides detailed error information
- Backend logs will show verification attempts

## 📊 Cost Comparison

| Service | Cost per SMS | Monthly Free Tier | Best For |
|---------|-------------|-------------------|----------|
| **Firebase** | FREE | 10,000 verifications | Global |
| **Text.lk** | LKR 0.64 | Free trial | Sri Lanka |
| **SMSlenz.lk** | LKR 0.59-0.84 | 500 free SMS | Sri Lanka |
| **Twilio** | ~$0.0075 | $15 credit | Global |

## 🎉 You're Done!

Your Futsal Booking System now uses:
- ✅ **Real Firebase phone authentication**
- ✅ **Real SMS delivery** to phone numbers
- ✅ **Firestore database** instead of Prisma
- ✅ **Production-ready** authentication system
- ✅ **10,000 free verifications** per month

## 📞 Support

If you encounter any issues:
1. Check the Firebase Console for error logs
2. Verify your environment variables
3. Test with a valid Sri Lankan phone number
4. Check the browser console for client-side errors
5. Ensure Firestore security rules are properly configured

## 🔄 Migration from Prisma

The system has been completely migrated from Prisma to Firestore:
- All database operations now use Firestore
- No more SQLite database files
- Real-time data synchronization
- Better scalability for production
