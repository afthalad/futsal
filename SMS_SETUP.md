
# SMS/OTP Setup Guide

This guide explains how to set up SMS/OTP functionality for your Futsal Booking System.

## 🚀 Current Implementation

The app currently uses a **development-only OTP system** that:
- Generates random 6-digit OTPs
- Logs OTPs to the console (for testing)
- Accepts any 6-digit OTP for verification
- **No SMS costs** during development

## 📱 How It Works

1. **User enters phone number** → System generates OTP
2. **OTP is logged to console** → User can see it in browser console
3. **User enters OTP** → System verifies and creates/authenticates user
4. **User gets logged in** → JWT token is generated

## 🔧 Testing the System

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to login page:**
   ```
   http://localhost:3000/auth/login
   ```

3. **Enter a Sri Lankan phone number:**
   - Format: `0771234567` or `94771234567`
   - Click "Send OTP"

4. **Check the console for OTP:**
   - Open browser developer tools (F12)
   - Look for: `OTP for 0771234567: 123456`

5. **Enter the OTP and complete login**

## 🚀 Production Setup

For production, you'll want to integrate a real SMS service. Here are the recommended options for Sri Lanka:

### Option 1: Text.lk (Recommended)
- **Cost**: LKR 0.64 per SMS
- **Features**: Free trial, no monthly fees
- **Setup**: Sign up at [text.lk](https://text.lk)

### Option 2: SMSlenz.lk
- **Cost**: LKR 0.59-0.84 per SMS
- **Features**: 500 free SMS with LKR 1,500 setup
- **Setup**: Sign up at [smslenz.lk](https://smslenz.lk)

### Option 3: Twilio
- **Cost**: ~$0.0075 per SMS
- **Features**: Reliable, global service
- **Setup**: Sign up at [twilio.com](https://twilio.com)

## 🔧 Integrating a Real SMS Service

To integrate a real SMS service, update the `lib/sms.ts` file:

```typescript
// Example: Text.lk integration
export async function sendOTP(phone: string): Promise<{ success: boolean; error?: string; verificationId?: string }> {
  try {
    const otp = generateOTP()
    
    // Send SMS via Text.lk API
    const response = await fetch('https://api.text.lk/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TEXT_LK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: phone.startsWith('+94') ? phone : `+94${phone.replace(/^0/, '')}`,
        message: `Your Futsal Booking verification code is: ${otp}. Valid for 5 minutes.`
      })
    })
    
    if (response.ok) {
      return { success: true, verificationId: `text_${Date.now()}` }
    } else {
      throw new Error('Failed to send SMS')
    }
  } catch (error) {
    console.error('SMS Error:', error)
    return { success: false, error: error.message }
  }
}
```

## 🔧 Environment Variables

Add your SMS service configuration to `.env.local`:

```env
# Text.lk
TEXT_LK_API_KEY="your-api-key"

# SMSlenz.lk
SMSLENZ_API_KEY="your-api-key"

# Twilio
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="your-phone-number"
```

## 📊 Cost Comparison

| Service | Cost per SMS | Monthly Free Tier | Best For |
|---------|-------------|-------------------|----------|
| **Text.lk** | LKR 0.64 | Free trial | Sri Lanka |
| **SMSlenz.lk** | LKR 0.59-0.84 | 500 free SMS | Sri Lanka |
| **Twilio** | ~$0.0075 | $15 credit | Global |
| **Current (Dev)** | FREE | Unlimited | Development |

## 🎯 Next Steps

1. **Test the current system** using the development OTP
2. **Choose an SMS service** based on your needs
3. **Integrate the SMS service** by updating `lib/sms.ts`
4. **Test with real SMS** in production
5. **Monitor costs** and usage

## 🔧 Troubleshooting

### Common Issues:

1. **"OTP not received"**
   - Check browser console for logged OTP
   - Ensure phone number format is correct

2. **"Invalid OTP"**
   - Make sure OTP is exactly 6 digits
   - Check if OTP has expired

3. **"Phone number validation failed"**
   - Use format: `0771234567` or `94771234567`
   - Ensure it's a Sri Lankan number

### Debug Mode:
- Check browser console for detailed logs
- OTPs are logged with phone numbers
- All API responses are logged

## 🎉 You're Ready!

Your Futsal Booking System now has a working OTP system that's perfect for development and can be easily upgraded to use real SMS services for production!
