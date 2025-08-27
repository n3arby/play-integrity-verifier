import { verifyPlayIntegrity } from '@n3arby/play-integrity-verifier';

// Example usage of the Play Integrity Verifier using official Google APIs
async function example() {
  // This would be the token you receive from your Android app
  const integrityToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...'; // Your actual token here
  
  // Your Google service account credentials
  const credentials = {
    clientEmail: 'your-service-account@your-project.iam.gserviceaccount.com',
    privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----`
  };

  // Your app's package name (REQUIRED for verification)
  const expectedPackageName = 'com.yourcompany.yourapp';

  try {
    console.log('Verifying Play Integrity token...');
    
    const result = await verifyPlayIntegrity(integrityToken, credentials, expectedPackageName);
    
    console.log('✅ Verification successful!');
    console.log('\n📱 Request Details:');
    console.log(`  Package: ${result.requestDetails?.requestPackageName}`);
    console.log(`  Timestamp: ${result.requestDetails?.timestampMillis}`);
    console.log(`  Nonce: ${result.requestDetails?.nonce}`);
    
    console.log('\n🔐 App Integrity:');
    console.log(`  Verdict: ${result.appIntegrity?.appRecognitionVerdict}`);
    console.log(`  Package: ${result.appIntegrity?.packageName}`);
    console.log(`  Version: ${result.appIntegrity?.versionCode}`);
    
    console.log('\n📱 Device Integrity:');
    console.log(`  Verdict: ${result.deviceIntegrity?.deviceRecognitionVerdict?.join(', ')}`);
    
    console.log('\n📄 Account Details:');
    console.log(`  Licensing: ${result.accountDetails?.appLicensingVerdict}`);
    
    // Check if the app is legitimate
    const isAppLegitimate = result.appIntegrity?.appRecognitionVerdict === 'PLAY_RECOGNIZED';
    const isDeviceAuthentic = result.deviceIntegrity?.deviceRecognitionVerdict?.includes('MEETS_DEVICE_INTEGRITY');
    
    if (isAppLegitimate && isDeviceAuthentic) {
      console.log('\n✅ App and device are legitimate!');
    } else {
      console.log('\n⚠️  Warning: App or device may not be legitimate');
      if (!isAppLegitimate) console.log('   - App not recognized by Play Store');
      if (!isDeviceAuthentic) console.log('   - Device integrity check failed');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    
    // Handle specific error types
    if (error.message.includes('INVALID_ARGUMENT')) {
      console.error('💡 Check that your token is valid and not expired');
    } else if (error.message.includes('PERMISSION_DENIED')) {
      console.error('💡 Check your service account permissions');
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      console.error('💡 API quota exceeded, try again later');
    }
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  example().catch(console.error);
}

export { example };
