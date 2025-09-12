# Resend OTP Feature Testing Guide

## 🎯 **Overview**
This guide covers testing the new "Resend OTP" functionality in the authentication system, which allows users to request a new OTP via Firebase and Text.lk SMS service.

---

## 🔧 **Features Implemented**

### **1. Resend OTP Button**
- **Location**: OTP verification step in `/auth/login`
- **Functionality**: Sends new OTP via Firebase and Text.lk
- **Cooldown**: 30-second cooldown between resend attempts
- **Visual Feedback**: Shows countdown timer and loading states

### **2. Enhanced User Experience**
- **OTP Timestamp**: Shows when OTP was sent
- **Validity Notice**: Indicates OTP is valid for 5 minutes
- **Cooldown Timer**: Prevents spam resend requests
- **Input Clearing**: Clears OTP input when resending

---

## 🧪 **Test Cases**

### **Test Case 1: Basic Resend OTP**

**Steps:**
1. Go to `/auth/login`
2. Enter phone number: `0771234567`
3. Click "Send OTP"
4. Wait for OTP step to appear
5. Click "Resend OTP" button

**Expected Results:**
- ✅ New OTP sent via Text.lk
- ✅ Success message: "New OTP sent to your phone number via SMS"
- ✅ OTP input field is cleared
- ✅ New timestamp displayed
- ✅ 30-second cooldown starts

---

### **Test Case 2: Resend Cooldown Timer**

**Steps:**
1. Send initial OTP
2. Click "Resend OTP" immediately
3. Try to click "Resend OTP" again within 30 seconds

**Expected Results:**
- ✅ First resend works normally
- ✅ Second click shows error: "Please wait X seconds before resending"
- ✅ Button shows "Resend in Xs" with countdown
- ✅ Button is disabled during cooldown
- ✅ Button becomes enabled after cooldown expires

---

### **Test Case 3: SMS Delivery Verification**

**Steps:**
1. Send initial OTP
2. Check SMS received
3. Click "Resend OTP"
4. Check for new SMS

**Expected Results:**
- ✅ First SMS received with OTP
- ✅ Second SMS received with new OTP
- ✅ SMS sent via Text.lk service
- ✅ Console logs show provider confirmation
- ✅ Different OTP codes in each SMS

---

### **Test Case 4: OTP Input Clearing**

**Steps:**
1. Enter phone number and send OTP
2. Enter some digits in OTP field
3. Click "Resend OTP"
4. Check OTP input field

**Expected Results:**
- ✅ OTP input field is cleared after resend
- ✅ User can enter new OTP
- ✅ No confusion with old OTP

---

### **Test Case 5: Timestamp Display**

**Steps:**
1. Send initial OTP
2. Note the timestamp displayed
3. Click "Resend OTP"
4. Check new timestamp

**Expected Results:**
- ✅ Initial timestamp shows when first OTP was sent
- ✅ New timestamp shows when resend OTP was sent
- ✅ Timestamps are accurate and readable
- ✅ "OTP is valid for 5 minutes" message displayed

---

### **Test Case 6: Loading States**

**Steps:**
1. Send initial OTP
2. Click "Resend OTP" quickly
3. Observe button state during API call

**Expected Results:**
- ✅ Button shows "Sending..." during API call
- ✅ Button is disabled during loading
- ✅ Button returns to normal state after completion
- ✅ No multiple simultaneous requests

---

### **Test Case 7: Error Handling**

**Steps:**
1. Test with invalid phone number
2. Test with network issues
3. Test with SMS service failure

**Expected Results:**
- ✅ Appropriate error messages displayed
- ✅ Button returns to normal state after error
- ✅ Cooldown timer not affected by errors
- ✅ User can retry after error

---

### **Test Case 8: Multiple Resend Attempts**

**Steps:**
1. Send initial OTP
2. Wait for cooldown to expire
3. Click "Resend OTP"
4. Wait for cooldown to expire again
5. Click "Resend OTP" again

**Expected Results:**
- ✅ Each resend works after cooldown
- ✅ New OTP sent each time
- ✅ Timestamps update correctly
- ✅ Cooldown timer works for each attempt

---

### **Test Case 9: OTP Verification After Resend**

**Steps:**
1. Send initial OTP
2. Click "Resend OTP"
3. Use the new OTP to verify
4. Complete login process

**Expected Results:**
- ✅ New OTP works for verification
- ✅ Old OTP is invalidated
- ✅ Login process completes successfully
- ✅ User redirected to appropriate dashboard

---

### **Test Case 10: Back Navigation**

**Steps:**
1. Send OTP and go to OTP step
2. Click "Resend OTP"
3. Click "Back" button
4. Go through process again

**Expected Results:**
- ✅ Back button works normally
- ✅ Resend functionality still works
- ✅ No state conflicts
- ✅ Clean navigation flow

---

## 🔍 **Technical Verification**

### **Console Logs to Check**
```bash
✅ "📱 Attempting to send SMS to +94771234567"
✅ "🔄 Trying Text.lk..."
✅ "✅ SMS sent successfully via Text.lk"
✅ "✅ OTP sent via Text.lk"
```

### **SMS Content Verification**
- **Format**: 6-digit OTP code
- **Message**: "🔐 Your OTP code is: XXXXXX. Valid for 5 minutes. Do not share this code with anyone."
- **Sender**: Text.lk service
- **Delivery**: Real-time via Text.lk API

### **State Management**
- **Cooldown Timer**: 30 seconds countdown
- **Loading States**: Proper loading indicators
- **Error Handling**: Graceful error recovery
- **Input Clearing**: OTP field cleared on resend

---

## 🚨 **Common Issues & Solutions**

### **Issue: Resend Button Not Working**
- **Check**: Console for JavaScript errors
- **Check**: Network connectivity
- **Check**: API endpoint availability

### **Issue: Cooldown Timer Not Working**
- **Check**: useEffect dependencies
- **Check**: State updates
- **Check**: Timer cleanup

### **Issue: SMS Not Received**
- **Check**: Text.lk API credentials
- **Check**: Phone number format
- **Check**: SMS service status

### **Issue: OTP Input Not Clearing**
- **Check**: setFormData state update
- **Check**: Input value binding
- **Check**: React re-rendering

---

## 📱 **Mobile Testing**

### **Touch Interactions**
- ✅ Resend button is touch-friendly
- ✅ Cooldown timer is visible on mobile
- ✅ Loading states work on mobile
- ✅ Error messages are readable

### **Responsive Design**
- ✅ Button layout works on small screens
- ✅ Text is readable on mobile
- ✅ Timestamps display properly
- ✅ No layout breaking

---

## ✅ **Success Criteria**

The resend OTP feature is working correctly when:

1. **✅ Resend button sends new OTP via Text.lk**
2. **✅ 30-second cooldown timer works properly**
3. **✅ OTP input field clears on resend**
4. **✅ Timestamps display accurately**
5. **✅ Loading states work correctly**
6. **✅ Error handling is robust**
7. **✅ Multiple resend attempts work**
8. **✅ New OTP can be verified successfully**
9. **✅ Console logs show Text.lk confirmation**
10. **✅ Mobile experience is smooth**

---

## 🎉 **Testing Complete!**

Once all test cases pass, the resend OTP feature is ready for production use. Users can now:

- **Request new OTP** when needed
- **See clear feedback** about resend status
- **Avoid spam** with cooldown protection
- **Get new OTP** via reliable Text.lk service
- **Experience smooth UX** with proper loading states

**The authentication system now provides a complete and user-friendly OTP verification experience!**
