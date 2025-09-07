  # Text.lk SMS Service Setup Guide

## Overview
Text.lk is a Sri Lankan SMS service provider that offers reliable SMS delivery for local and international numbers.

## Setup Steps

### 1. Create Text.lk Account
1. Visit [Text.lk](https://text.lk/)
2. Sign up for an account
3. Verify your email and phone number
4. Complete the account verification process

### 2. Get API Credentials
1. Log in to your Text.lk dashboard
2. Navigate to **API Settings** or **Developer Tools**
3. Generate an API key
4. Note down your **Sender ID** (you may need to request approval for custom sender IDs)

### 3. Configure Environment Variables
Add these to your `.env.local` file:

```env
# Text.lk Configuration
TEXT_LK_API_KEY="your-api-key-from-text-lk-dashboard"
TEXT_LK_SENDER_ID="YourSenderID"
```

### 4. Test SMS Sending
1. Start your development server: `npm run dev`
2. Go to http://localhost:3000/test-sms
3. Enter a phone number and test message
4. Click "Send Test SMS"
5. Check the console for delivery status

## API Details

### Endpoint
```
POST https://app.text.lk/api/v3/sms/send
```

### Headers
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_API_KEY
```

### Request Body
```json
{
  "recipient": "94773078103",
  "sender_id": "YourSenderID",
  "type": "plain",
  "message": "Your message here"
}
```

### Phone Number Format
- Remove the `+` sign
- Use `94` prefix for Sri Lankan numbers
- Example: `+94773078103` becomes `94773078103`

## Pricing
- Check Text.lk website for current pricing
- Usually very affordable for Sri Lankan numbers
- International SMS may have different rates

## Features
- ✅ Reliable delivery to Sri Lankan numbers
- ✅ International SMS support
- ✅ Delivery reports
- ✅ Custom sender IDs
- ✅ API integration
- ✅ Affordable pricing

## Troubleshooting

### Common Issues
1. **Invalid API Key**: Double-check your API key in the dashboard
2. **Invalid Sender ID**: Use approved sender ID or request approval
3. **Invalid Phone Number**: Ensure proper formatting (94 prefix, no + sign)
4. **Rate Limiting**: Check if you've exceeded daily limits

### Support
- Text.lk Support: Check their website for contact information
- Documentation: https://text.lk/docs/

## Integration Status
✅ Text.lk provider implemented
✅ Automatic fallback to other providers
✅ Phone number validation
✅ Error handling
✅ Console logging for debugging
