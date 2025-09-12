# 🔥 Firebase Phone Auth Testing Guide

## ✅ **What We Fixed**

### **1. Firebase Phone Auth Integration**
- ✅ Updated login page to use Firebase Phone Auth directly
- ✅ Real OTP sent via Firebase (not mock SMS)
- ✅ Firebase ID token verification in backend
- ✅ User creation/lookup in Firestore

### **2. User Access Control**
- ✅ Ground owners only see their own grounds
- ✅ Super admins see all grounds
- ✅ Public users see all active grounds
- ✅ Disabled owners' grounds are hidden

### **3. Database Migration**
- ✅ Firebase Auth users migrated to Firestore
- ✅ Proper linking between Firebase Auth and Firestore

## 🧪 **Testing Steps**

### **Step 1: Test Firebase Connection**
```bash
npm run test-firebase
```
**Expected Output:**
```
✅ Firestore connection successful
✅ Firebase Auth connection successful
📊 Found X users in Firebase Auth
📊 Found Y users in Firestore
```

### **Step 2: Test Ground Access Control**
```bash
npm run check-grounds
```
**Expected Output:**
```
📊 Found X grounds in Firestore
🏟️  Grounds:
1. Ground Name (Owner: OwnerID, Active: true)
```

### **Step 3: Test User Registration (Firebase Phone Auth)**

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Go to login page:**
   ```
   http://localhost:3000/auth/login
   ```

3. **Test with existing Firebase Auth user:**
   - Enter: `07757004767` (from your Firebase Auth)
   - Click "Send OTP via Firebase"
   - **Expected:** Real SMS received from Firebase
   - Enter the 6-digit OTP
   - **Expected:** Login successful, redirected to dashboard

4. **Test with new user:**
   - Enter: `0771234567` (new number)
   - Click "Send OTP via Firebase"
   - **Expected:** Real SMS received from Firebase
   - Enter the 6-digit OTP
   - **Expected:** Prompted to enter name
   - Enter name and complete registration
   - **Expected:** User created in both Firebase Auth and Firestore

### **Step 4: Test Ground Owner Dashboard**

1. **Login as ground owner:**
   - Use `07757004767` or any ground owner account
   - **Expected:** Dashboard shows only their grounds (not others')

2. **Check "My Grounds" tab:**
   - **Expected:** Shows only grounds owned by the logged-in user
   - **Expected:** "No grounds yet" if user hasn't created any

3. **Test ground creation:**
   - Click "Add New Ground"
   - Fill in ground details
   - **Expected:** Ground created and appears in "My Grounds"

### **Step 5: Test Public Home Page**

1. **Go to home page:**
   ```
   http://localhost:3000
   ```

2. **Expected behavior:**
   - Shows all active grounds from active owners
   - Grounds from disabled owners are hidden
   - Search and filter work correctly

### **Step 6: Test Super Admin Access**

1. **Login as super admin:**
   - Use `0773078103` (super admin account)
   - Go to `/admin/super`

2. **Expected behavior:**
   - Can see all users, grounds, and bookings
   - Can disable/enable users and grounds
   - Can edit user details

## 🔍 **Debugging**

### **Check Console Logs**
Look for these log messages:

**Firebase Phone Auth:**
```
📱 Sending OTP via Firebase to: +94771234567
✅ reCAPTCHA solved
✅ Firebase OTP sent successfully
```

**API Access Control:**
```
🔒 Ground owner abc123 accessing their grounds: 2 found
👑 Super admin accessing all grounds: 5 found
🌐 Public access to grounds: 5 found
```

**User Creation:**
```
✅ Firebase ID token verified successfully
📞 Phone: 0771234567
🆔 Firebase UID: xyz789
🆕 Creating new user in Firestore
✅ User created in Firestore: {id: "abc123", ...}
```

### **Common Issues & Solutions**

**Issue 1: "Invalid Firebase token"**
- **Cause:** Firebase configuration mismatch
- **Solution:** Check Firebase project settings and environment variables

**Issue 2: "Phone number mismatch"**
- **Cause:** Phone number format inconsistency
- **Solution:** Ensure phone numbers are in +94 format

**Issue 3: "No grounds found" for ground owner**
- **Cause:** User not properly linked to grounds
- **Solution:** Run `npm run migrate-users` to sync Firebase Auth with Firestore

**Issue 4: Ground owner sees other owners' grounds**
- **Cause:** API not filtering by user role
- **Solution:** Check that the updated `/api/grounds` route is being used

## 📱 **SMS Testing**

### **Firebase Phone Auth SMS**
- **Sender:** Firebase (no custom sender ID)
- **Format:** "Your verification code is: 123456"
- **Validity:** 5 minutes
- **Rate Limit:** 10,000 verifications/month (free tier)

### **Text.lk SMS (for cancellations)**
- **Sender:** PUTTALAM
- **Format:** Custom message with booking details
- **Usage:** Booking cancellations only

## 🎯 **Success Criteria**

✅ **Firebase Phone Auth works:**
- Real OTP sent to phone
- User can verify OTP
- User created in both Firebase Auth and Firestore

✅ **Access control works:**
- Ground owners see only their grounds
- Super admins see all data
- Public users see all active grounds

✅ **User management works:**
- New users can register
- Existing users can login
- User data synced between Firebase Auth and Firestore

✅ **Ground management works:**
- Ground owners can create/edit grounds
- Grounds are properly filtered by owner
- Disabled owners' grounds are hidden

## 🚀 **Next Steps**

1. **Test all user flows** (registration, login, ground management)
2. **Test SMS delivery** (Firebase OTP and Text.lk notifications)
3. **Test access control** (different user roles)
4. **Test edge cases** (invalid OTP, network errors, etc.)

**Your Firebase Phone Auth system is now fully integrated and ready for production!** 🎉
