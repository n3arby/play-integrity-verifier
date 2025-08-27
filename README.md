# @n3arby/play-integrity-verifier

A TypeScript library for verifying Google Play Integrity API responses using the official Google APIs client library. This package helps you validate the integrity of Android app installations and device authenticity using Google's Play Integrity API.

## Features

- 🔐 Verify Play Integrity tokens server-side using official Google APIs
- 📱 Check app integrity and device authenticity
- 🛡️ Validate app licensing status
- 🌐 TypeScript support with full type definitions
- ⚡ Modern async/await API
- 🏗️ Built on official `@googleapis/playintegrity` library

## Installation

```bash
npm install @n3arby/play-integrity-verifier
```

## Prerequisites

1. **Google Cloud Project**: Set up a Google Cloud project with Play Integrity API enabled
2. **Service Account**: Create a service account with Play Integrity API permissions
3. **Service Account Key**: Download the JSON key file for your service account

### Enable Play Integrity API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" > "Library"
4. Search for "Play Integrity API" and enable it

### Create Service Account

1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Give it a name and description
4. Grant the "Play Integrity API Service Agent" role
5. Create and download the JSON key file

## Usage

### Basic Example

```typescript
import { verifyPlayIntegrity } from '@n3arby/play-integrity-verifier';

async function verifyToken() {
  const integrityToken = 'YOUR_INTEGRITY_TOKEN_FROM_ANDROID_APP';
  const expectedPackageName = 'com.yourcompany.yourapp'; // Your app's package name
  
  const credentials = {
    clientEmail: 'your-service-account@project.iam.gserviceaccount.com',
    privateKey: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n'
  };

  try {
    const result = await verifyPlayIntegrity(integrityToken, credentials, expectedPackageName);
    
    console.log('App package name:', result.requestDetails?.requestPackageName);
    console.log('App integrity verdict:', result.appIntegrity?.appRecognitionVerdict);
    console.log('Device integrity verdict:', result.deviceIntegrity?.deviceRecognitionVerdict);
    console.log('App licensing verdict:', result.accountDetails?.appLicensingVerdict);
    
  } catch (error) {
    console.error('Verification failed:', error.message);
  }
}
```

### Express.js Integration

```typescript
import express from 'express';
import { verifyPlayIntegrity } from '@n3arby/play-integrity-verifier';

const app = express();
app.use(express.json());

const credentials = {
  clientEmail: process.env.GOOGLE_CLIENT_EMAIL!,
  privateKey: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n')
};

app.post('/verify-integrity', async (req, res) => {
  try {
    const { integrityToken, packageName } = req.body;
    
    if (!integrityToken) {
      return res.status(400).json({ error: 'Missing integrity token' });
    }
    
    if (!packageName) {
      return res.status(400).json({ error: 'Missing package name' });
    }
    
    const result = await verifyPlayIntegrity(integrityToken, credentials, packageName);
    
    // Check if app is recognized and device is authentic
    const isAppLegitimate = result.appIntegrity?.appRecognitionVerdict === 'PLAY_RECOGNIZED';
    const isDeviceAuthentic = result.deviceIntegrity?.deviceRecognitionVerdict?.includes('MEETS_DEVICE_INTEGRITY');
    
    res.json({
      verified: isAppLegitimate && isDeviceAuthentic,
      appIntegrity: result.appIntegrity,
      deviceIntegrity: result.deviceIntegrity,
      requestDetails: result.requestDetails
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Using with Environment Variables

```typescript
import { verifyPlayIntegrity } from '@n3arby/play-integrity-verifier';

// Load from environment variables
const credentials = {
  clientEmail: process.env.GOOGLE_CLIENT_EMAIL!,
  privateKey: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n')
};

async function verify(token: string, packageName: string) {
  return await verifyPlayIntegrity(token, credentials, packageName);
}
```

### Android Client Side (for reference)

```kotlin
// In your Android app, generate the integrity token
val integrityManager = IntegrityManagerFactory.create(applicationContext)
val integrityTokenRequest = IntegrityTokenRequest.builder()
    .setNonce("your-unique-nonce")
    .build()

integrityManager.requestIntegrityToken(integrityTokenRequest)
    .addOnSuccessListener { response ->
        val token = response.token()
        // Send this token to your server for verification
        sendTokenToServer(token)
    }
    .addOnFailureListener { exception ->
        // Handle error
    }
```

## API Reference

### `verifyPlayIntegrity(token, credentials, expectedPackageName)`

Verifies a Play Integrity token and returns the decoded response.

#### Parameters

- `token` (string): The integrity token received from the Android app
- `credentials` (PlayIntegrityCredentials): Google service account credentials
- `expectedPackageName` (string): The expected package name of your Android app (e.g., 'com.example.myapp')

#### Returns

Promise<PlayIntegrityResponse> - The decoded and verified integrity response

### Types

#### `PlayIntegrityCredentials`

```typescript
interface PlayIntegrityCredentials {
  clientEmail: string;    // Service account email
  privateKey: string;     // Service account private key (PEM format)
}
```

#### `PlayIntegrityResponse`

```typescript
interface PlayIntegrityResponse {
  requestDetails?: {
    requestPackageName?: string;  // Package name of the app
    timestampMillis?: string;     // Request timestamp
    nonce?: string;               // Nonce used in the request
  };
  appIntegrity?: {
    appRecognitionVerdict?: string;      // PLAY_RECOGNIZED, UNRECOGNIZED_VERSION, etc.
    packageName?: string;                // App package name
    certificateSha256Digest?: string[];  // App signing certificate digests
    versionCode?: string;                // App version code
  };
  deviceIntegrity?: {
    deviceRecognitionVerdict?: string[]; // MEETS_DEVICE_INTEGRITY, etc.
  };
  accountDetails?: {
    appLicensingVerdict?: string;        // LICENSED, UNLICENSED, etc.
  };
}
```

## Environment Variables

For production use, store your credentials as environment variables:

```bash
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Error Handling

The library throws descriptive errors for various failure scenarios:

```typescript
try {
  const result = await verifyPlayIntegrity(token, credentials);
} catch (error) {
  if (error.message.includes('Play Integrity verification failed')) {
    // Handle API-specific errors (invalid token, quota exceeded, etc.)
  } else {
    // Handle other errors (network, authentication, etc.)
  }
}
```

## Security Considerations

1. **Server-side only**: Never verify tokens on the client side
2. **Secure credentials**: Store service account keys securely
3. **Token freshness**: Verify tokens promptly after generation
4. **Nonce validation**: Always validate the nonce in your server logic
5. **Package name validation**: The library automatically validates that the package name in the token matches your expected package name
6. **Required package name**: Always provide the expected package name - this is crucial for security as it prevents token replay attacks from other apps

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
