const admin = require('firebase-admin');

// Initialize Firebase Admin using environment variables
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID || "uplifted-block-469516-k4",
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDhUGakxM5qrn5+
7ljKYZ5eBZya1VZbQlm0glTOXQHs0srRJy1mgOJ+QXTxpWCM3J56vcNzpKMBtrtA
H2BvrNDOqpqALCbmIEoMqsueBJCKPIV+5PVAwxcDQcMiR4OuMwdxfep/EccDSiL9
O313NI27Whh+duJe5GzlW2LUtdJ4lRnYvT+ovEzR/1ErTyYdvG4PeDnDovIX1XhR
YEXeDXneOD/xIpHTJUOCRGlHbFNlEpaSr8pnvPYaY0jeygihuQGFphGbRcdGJoHN
bWegmvoBuSrnqjdlEAJ18n2d/aaMTR/R9ldv09F2ZbehWYzjatEtCHsNkXN/bYTK
/9dk0qtvAgMBAAECggEARoXk6tPTDB875rzxu77cU++LugbmdcAJ1e8pXkJMVPUR
mG+bzUawHfadBPnPg6eWTzLQV4UDpIiuiX6Ir8u2u8k4fL/VGRioNNjMzNP+7dXN
rw85GKE3tcRCsJsTw1WjkclouYc19HijBQI23jXr2uVzXzoU1sDGuO9mus+CZk0m
XS88H5KukNkGAGKWKDQ8oSJElEK7fSuPnCsGhA1Mb+n3p6/yPl/WJsmOQ8uYFbBm
lNhtLenCkywrpPq7yMjp9p861pWITUHDVGEMfufRfdt5nmyoiKisdas1tWigPx02
HlheejpNxFHgLCJRdPAvucB0n4Xh+wsA+AK1HzWyuQKBgQD/bIfUA5A2GOtqK7mb
SBiI5o4KYxflHVnNFbG7rGM/Pqd4jfjOvvkAU3TKiCjmO/MdrOW61BpB6YEKBJTk
RFiik5dSdaIuAFhfBWnfxmQU5MOMsmBgXzESzluruBpPMWie4dn4RNdT1HWGuHzd
WSCbbI6rkEOGxjs6h0fbslC3iwKBgQDh0nyDu9nB1zJkgOfqUh9JMaoaupG31FGm
3lln7FqdGXbNFR5uX7AOVdB31JfhG5azpl3MJ/W2yaDaaY8zLAKAEq14//hZ4KFD
ahkPX0I1kzTyj51LIcLEfrJYiSu3Z03rHCJAgoXhxqIytOPBIjZIpa3iaMTG4qRx
id9H3PQ4LQKBgQCNHPnBsSJIMOZGpteJKYCcibupk2uNIfUN79FcnPXL6CJ/4Pe3
yRwqCPF6P1VRNYewOmhFGo9TIN0wmq1jmzrYvu+YF/M8tOYdwRDoF2QNgwFiRt4m
ABFNkYJl0XV/kQ160c4pcmcAIl23y074vxfbplMAB9i2qefpAvo5Lz+W1wKBgGhW
IEGdYZc2HophJMYW+22ODNIcsYcGClPXF+f0REmhokpPH6hPfcCh1ZgIGcRgQtju
XRgevmCd+Dvx2cAC7YTPHGdznQOpzdigBMQddzHZufT4dexoxNyUzUIq3o/2owGm
Fg1IQSN36ykSesiZTgtywUyCq6hYvzHWSduiMxRhAoGAcrtpwRQWFRG8z7Y1BIbO
mRf9udl7QlS1PeB2in85ZqC9Ok+sHfOru+tqMDAajscjzynkTVo2OhGJ1cllaqam
55MDaKMP5eh4w8wlazm9+fAFkDBHFYc0XMfXw9aBddX0XYCP64k2stUtxSYl8lcv
lVbgKXXm2mf/R5ANE2y/Eqc=
-----END PRIVATE KEY-----`).replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@uplifted-block-469516-k4.iam.gserviceaccount.com",
  })
});

const db = admin.firestore();

async function testConnection() {
  try {
    console.log('🔄 Testing Firebase connection...');
    
    // Test Firestore connection
    const testDoc = await db.collection('test').doc('connection').get();
    console.log('✅ Firestore connection successful');
    
    // Test Firebase Auth connection
    const listUsersResult = await admin.auth().listUsers(1);
    console.log('✅ Firebase Auth connection successful');
    console.log(`📊 Found ${listUsersResult.users.length} users in Firebase Auth`);
    
    // List Firebase Auth users
    if (listUsersResult.users.length > 0) {
      console.log('\n📱 Firebase Auth Users:');
      listUsersResult.users.forEach((user, index) => {
        console.log(`${index + 1}. Phone: ${user.phoneNumber}, UID: ${user.uid}`);
      });
    }
    
    // Test Firestore users collection
    const usersSnapshot = await db.collection('users').limit(5).get();
    console.log(`\n📊 Found ${usersSnapshot.size} users in Firestore`);
    
    if (usersSnapshot.size > 0) {
      console.log('\n👥 Firestore Users:');
      usersSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. Phone: ${data.phone}, Name: ${data.name}, Role: ${data.role}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

// Run test
testConnection();
