# Testing Guide for New Features

This guide covers testing all the newly implemented features in the futsal booking system.

## 🎯 New Features Implemented

1. **Immediate Booking Modal on Time Slot Click**
2. **Due Limit Warning for Ground Owners**
3. **Reason Prompt for Super Admin Disable Actions**
4. **Hide Disabled Ground Owner's Grounds from Home Screen**

---

## 1. Immediate Booking Modal on Time Slot Click

### Test Case 1.1: Regular User Booking Flow
**Steps:**
1. Navigate to any ground detail page (e.g., `/grounds/[ground-id]`)
2. Select a date from the calendar
3. Click on any available time slot
4. **Expected Result:** Booking modal should open immediately with name and phone fields pre-filled with the selected time slot

### Test Case 1.2: Ground Owner Access
**Steps:**
1. Login as a ground owner
2. Navigate to their own ground detail page
3. Click on any available time slot
4. **Expected Result:** No booking modal should open (ground owners cannot book their own grounds)

### Test Case 1.3: Booked Time Slot
**Steps:**
1. Navigate to a ground detail page
2. Click on a time slot that shows "Booked"
3. **Expected Result:** Should show booking details instead of opening booking modal

---

## 2. Due Limit Warning for Ground Owners

### Test Case 2.1: Normal Commission Display
**Steps:**
1. Login as a ground owner
2. Navigate to dashboard (`/admin/dashboard`)
3. Check the Commission Due section
4. **Expected Result:** Should show normal commission display without warning

### Test Case 2.2: High Due Warning
**Steps:**
1. Login as a ground owner with commission due > Rs. 1,000
2. Navigate to dashboard (`/admin/dashboard`)
3. Check the Commission Due section
4. **Expected Result:** Should show red warning box with "⚠️ Due Limit Exceeded: Your commission due has exceeded Rs. 1,000"

### Test Case 2.3: Warning Visibility
**Steps:**
1. Ensure ground owner has commission due > Rs. 1,000
2. Check that warning appears above the normal commission information
3. **Expected Result:** Warning should be prominently displayed with red background

---

## 3. Reason Prompt for Super Admin Disable Actions

### Test Case 3.1: Disable Ground Owner with Reason
**Steps:**
1. Login as super admin
2. Navigate to super admin panel (`/admin/super`)
3. Go to "Ground Owners Management" tab
4. Click "Disable" button for any active ground owner
5. **Expected Result:** Reason modal should open with predefined options and custom reason field

### Test Case 3.2: Reason Selection and Submission
**Steps:**
1. In the disable reason modal, select "Due exceeded" from predefined options
2. Click "Disable Owner" button
3. **Expected Result:** 
   - Modal should close
   - Success toast should appear
   - Ground owner should be disabled
   - SMS notification should be sent to ground owner

### Test Case 3.3: Custom Reason
**Steps:**
1. In the disable reason modal, select "Other"
2. Enter custom reason in the text area
3. Click "Disable Owner" button
4. **Expected Result:** Should work with custom reason

### Test Case 3.4: Disable Ground with Reason
**Steps:**
1. In super admin panel, go to "Grounds Management" tab
2. Click "Disable" button for any active ground
3. Select reason and submit
4. **Expected Result:** Ground should be disabled with reason stored

### Test Case 3.5: Enable Without Reason
**Steps:**
1. Click "Enable" button for any disabled ground owner or ground
2. **Expected Result:** Should enable immediately without reason modal

### Test Case 3.6: Validation
**Steps:**
1. Try to submit disable modal without selecting any reason
2. **Expected Result:** Submit button should be disabled

---

## 4. Hide Disabled Ground Owner's Grounds from Home Screen

### Test Case 4.1: Regular User Home Screen
**Steps:**
1. Login as regular user or visit home page without login
2. Navigate to home page (`/`)
3. **Expected Result:** Should only show grounds from active ground owners

### Test Case 4.2: Ground Owner Disabled
**Steps:**
1. As super admin, disable a ground owner
2. As regular user, refresh home page
3. **Expected Result:** Grounds from disabled owner should not appear

### Test Case 4.3: Ground Owner Re-enabled
**Steps:**
1. As super admin, re-enable the ground owner
2. As regular user, refresh home page
3. **Expected Result:** Grounds from re-enabled owner should appear again

### Test Case 4.4: Ground Owner Dashboard
**Steps:**
1. Login as ground owner
2. Navigate to dashboard (`/admin/dashboard`)
3. **Expected Result:** Should still see their own grounds even if disabled (for management purposes)

---

## 🔧 Testing Setup

### Prerequisites
1. Ensure you have test accounts for:
   - Super Admin
   - Ground Owner (with grounds)
   - Regular User
2. Ensure you have grounds with bookings to test commission scenarios
3. Have access to SMS testing (if available)

### Test Data Setup
1. Create a ground owner with commission due > Rs. 1,000
2. Create some bookings to generate commission
3. Ensure you have both active and inactive grounds

### Browser Testing
Test on multiple browsers:
- Chrome
- Firefox
- Safari
- Mobile browsers

### Device Testing
- Desktop
- Tablet
- Mobile phone

---

## 🐛 Common Issues to Check

### Issue 1: Booking Modal Not Opening
- Check if user is ground owner (should not open for own grounds)
- Verify time slot is available and not in the past
- Check browser console for JavaScript errors

### Issue 2: Warning Not Showing
- Verify commission amount is actually > 1,000
- Check if commission data is loading correctly
- Refresh the page to ensure latest data

### Issue 3: Reason Modal Not Working
- Check if user has super admin role
- Verify API endpoints are working
- Check browser network tab for failed requests

### Issue 4: Grounds Not Hiding
- Verify ground owner is actually disabled
- Check if grounds API is using the new filtering function
- Clear browser cache and refresh

---

## 📱 SMS Testing

### Test SMS Notifications
1. Disable a ground owner
2. Check if SMS is sent to their phone number
3. Verify SMS content includes the reason

### Test Ground Disable SMS
1. Disable a ground
2. Check if SMS is sent to ground owner
3. Verify SMS mentions the ground name and reason

---

## ✅ Success Criteria

All features are working correctly if:

1. ✅ Time slot clicks immediately open booking modal for regular users
2. ✅ Ground owners see due limit warning when commission > Rs. 1,000
3. ✅ Super admin must provide reason when disabling users/grounds
4. ✅ Disabled ground owner's grounds don't appear on home screen
5. ✅ SMS notifications are sent with appropriate reasons
6. ✅ All modals and forms validate input correctly
7. ✅ No JavaScript errors in browser console
8. ✅ All features work on mobile and desktop

---

## 🚀 Performance Testing

### Load Testing
1. Test with multiple grounds and users
2. Check API response times
3. Verify caching is working for grounds list

### Memory Testing
1. Check for memory leaks in modals
2. Verify proper cleanup of event listeners
3. Test with multiple modal opens/closes

---

## 📝 Bug Reporting

When reporting bugs, include:
1. Steps to reproduce
2. Expected vs actual behavior
3. Browser and device information
4. Console error messages
5. Screenshots if applicable

---

## 🔄 Regression Testing

After any changes, re-run all test cases to ensure:
1. Existing functionality still works
2. New features haven't broken old features
3. Performance hasn't degraded
4. All user flows are intact
