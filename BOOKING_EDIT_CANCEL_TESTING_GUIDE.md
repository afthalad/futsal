# Booking Edit & Cancel Feature Testing Guide

## 🎯 **Overview**
This guide covers testing the new booking edit and cancellation features for super admins, including SMS notifications.

---

## 📋 **Features to Test**

### 1. **Booking Edit Page**
- **Location**: `/admin/bookings/[id]/edit`
- **Access**: Super Admin only

### 2. **Booking Cancellation**
- **Location**: Super Admin panel → Bookings Management
- **Access**: Super Admin only

### 3. **SMS Notifications**
- **Triggered by**: Booking cancellation
- **Recipients**: Customer and Ground Owner

---

## 🧪 **Test Cases**

### **Test Case 1: Access Booking Edit Page**

**Steps:**
1. Login as Super Admin
2. Go to Super Admin panel → Bookings Management
3. Click "Edit" button on any active booking
4. Verify you're redirected to `/admin/bookings/[id]/edit`

**Expected Results:**
- ✅ Page loads successfully
- ✅ All booking details are pre-filled
- ✅ Form shows current booking information
- ✅ Price is auto-calculated based on ground and time

---

### **Test Case 2: Edit Booking Details**

**Steps:**
1. On the booking edit page, modify:
   - Customer name
   - Customer phone number
   - Ground selection
   - Date
   - Start time
   - End time
2. Click "Save Changes"

**Expected Results:**
- ✅ Form validation works (required fields)
- ✅ Phone number validation (Sri Lankan format)
- ✅ Price auto-updates when ground/time changes
- ✅ Success message appears
- ✅ Redirected back to super admin panel
- ✅ Changes are reflected in the bookings table

---

### **Test Case 3: Cancel Booking from Edit Page**

**Steps:**
1. On the booking edit page, click "Cancel Booking"
2. Enter a reason for cancellation
3. Click "Confirm Cancellation"

**Expected Results:**
- ✅ Cancellation modal opens
- ✅ Booking details are displayed
- ✅ Reason field is required
- ✅ SMS notifications are sent to customer and ground owner
- ✅ Success message appears
- ✅ Booking status changes to "Cancelled"
- ✅ Redirected back to super admin panel

---

### **Test Case 4: Cancel Booking from Super Admin Panel**

**Steps:**
1. Go to Super Admin panel → Bookings Management
2. Click "Cancel" button on any active booking
3. Enter a reason for cancellation
4. Click "Confirm Cancellation"

**Expected Results:**
- ✅ Cancellation modal opens
- ✅ Booking details are displayed
- ✅ Reason field is required
- ✅ SMS notifications are sent
- ✅ Success message appears
- ✅ Booking status changes to "Cancelled"
- ✅ Cancel button disappears for cancelled bookings

---

### **Test Case 5: SMS Notification Content (Text.lk Integration)**

**Steps:**
1. Cancel a booking using either method
2. Check SMS received by customer and ground owner
3. Verify SMS is sent via Text.lk service

**Expected Results:**
- ✅ **SMS sent via Text.lk service** (check console logs for provider confirmation)
- ✅ **Customer SMS contains:**
  - Customer name
  - Ground name
  - Booking date and time (formatted in Sri Lankan style)
  - Cancellation reason
  - Contact information (0773078103)
  - "Puttalam Grounds" branding

- ✅ **Ground Owner SMS contains:**
  - Customer details
  - Ground name
  - Booking date and time (formatted in Sri Lankan style)
  - Cancellation reason
  - "Puttalam Grounds" branding

- ✅ **Console logs show:**
  - "✅ Booking cancellation SMS sent to customer via Text.lk"
  - "✅ Booking cancellation SMS sent to ground owner via Text.lk"

---

### **Test Case 6: Edit Cancelled Booking**

**Steps:**
1. Try to edit a cancelled booking
2. Attempt to save changes

**Expected Results:**
- ✅ Edit page loads but shows "cancelled" status
- ✅ Form fields are disabled
- ✅ Save button is disabled
- ✅ Warning message about cancelled booking

---

### **Test Case 7: Form Validation**

**Steps:**
1. Try to save booking with:
   - Empty required fields
   - Invalid phone number format
   - Invalid date/time combinations

**Expected Results:**
- ✅ Appropriate error messages appear
- ✅ Form doesn't submit with invalid data
- ✅ Phone number validation works for Sri Lankan format

---

### **Test Case 8: Price Auto-Calculation**

**Steps:**
1. Select different grounds
2. Change start time between morning/evening
3. Observe price changes

**Expected Results:**
- ✅ Price updates automatically
- ✅ Morning slots show morning price
- ✅ Evening slots show evening price
- ✅ Price display shows both morning/evening rates

---

### **Test Case 9: Authorization & Security**

**Steps:**
1. Try to access edit page without login
2. Try to access with non-super admin account
3. Try to access with invalid booking ID

**Expected Results:**
- ✅ Redirected to login page when not authenticated
- ✅ Access denied for non-super admin users
- ✅ 404 error for invalid booking IDs

---

### **Test Case 10: Error Handling**

**Steps:**
1. Test with network issues
2. Test with invalid data
3. Test SMS service failures

**Expected Results:**
- ✅ Appropriate error messages
- ✅ Booking cancellation succeeds even if SMS fails
- ✅ Form doesn't break with invalid inputs

---

## 🔧 **Technical Verification**

### **Database Changes**
- ✅ `bookings` collection updated with:
  - `status: 'CANCELLED'`
  - `cancellationReason: string`
  - `cancelledAt: timestamp`
  - `cancelledBy: user_id`
  - `updatedAt: timestamp`

### **API Endpoints**
- ✅ `GET /api/admin/bookings/[id]` - Fetch booking details
- ✅ `PUT /api/admin/bookings/[id]` - Update booking
- ✅ `POST /api/admin/bookings/[id]/cancel` - Cancel booking

### **SMS Integration (Text.lk)**
- ✅ SMS sent to customer phone via Text.lk
- ✅ SMS sent to ground owner phone via Text.lk
- ✅ Proper error handling for SMS failures
- ✅ Console logging shows provider confirmation
- ✅ Fallback to mock SMS in development

---

## 🚨 **Common Issues & Solutions**

### **Issue: "Invalid Date" in Last Updated**
- **Solution**: Fixed with `formatFirebaseDate()` utility function

### **Issue: SMS not sending via Text.lk**
- **Check**: TEXT_LK_API_KEY environment variable
- **Check**: TEXT_LK_SENDER_ID environment variable
- **Check**: Phone number format (should be 94XXXXXXXXX)
- **Check**: Text.lk API status
- **Check**: Console logs for provider confirmation

### **Issue: Form validation errors**
- **Check**: Required field validation
- **Check**: Phone number regex pattern
- **Check**: Date/time format validation

### **Issue: Price not updating**
- **Check**: Ground selection
- **Check**: Time slot selection
- **Check**: Morning/evening price logic

---

## 📱 **Mobile Testing**

### **Responsive Design**
- ✅ Edit page works on mobile devices
- ✅ Modals are mobile-friendly
- ✅ Form inputs are touch-friendly
- ✅ Tables are responsive

### **Touch Interactions**
- ✅ Buttons are properly sized for touch
- ✅ Form inputs are easy to use
- ✅ Modals can be dismissed by tapping outside

---

## ✅ **Success Criteria**

All features are working correctly when:
1. ✅ Super admins can edit booking details
2. ✅ Super admins can cancel bookings with reasons
3. ✅ SMS notifications are sent to both parties
4. ✅ Form validation works properly
5. ✅ Price auto-calculation works
6. ✅ Cancelled bookings cannot be edited
7. ✅ UI is responsive and user-friendly
8. ✅ Error handling is robust
9. ✅ Authorization is properly enforced
10. ✅ Database updates are consistent

---

## 🎉 **Testing Complete!**

Once all test cases pass, the booking edit and cancellation features are ready for production use. The system now provides comprehensive booking management capabilities with proper SMS notifications and user experience enhancements.
