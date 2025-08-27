import { JWT } from 'google-auth-library';
import axios from 'axios';

export interface PlayIntegrityCredentials {
  clientEmail: string;
  privateKey: string;
}

export interface PlayIntegrityResponse {
  requestDetails?: {
    requestPackageName?: string;
    timestampMillis?: string;
    nonce?: string;
  };
  appIntegrity?: {
    appRecognitionVerdict?: string;
    packageName?: string;
    certificateSha256Digest?: string[];
    versionCode?: string;
  };
  deviceIntegrity?: {
    deviceRecognitionVerdict?: string[];
  };
  accountDetails?: {
    appLicensingVerdict?: string;
  };
}

/**
 * Verifies a Google Play Integrity API response
 * @param token The JWS token from Play Integrity API
 * @param credentials Google service account credentials
 * @param expectedPackageName The expected package name of your Android app (e.g., 'com.example.myapp')
 * @returns Decoded and verified Play Integrity response
 */
export async function verifyPlayIntegrity(
  token: string,
  credentials: PlayIntegrityCredentials,
  expectedPackageName: string
): Promise<PlayIntegrityResponse> {
  try {
    // Validate inputs
    if (!expectedPackageName || expectedPackageName.trim() === '') {
      throw new Error('Expected package name is required');
    }

    // Create JWT client for Google service account
    const jwtClient = new JWT({
      email: credentials.clientEmail,
      key: credentials.privateKey,
      scopes: ['https://www.googleapis.com/auth/playintegrity'],
    });

    // Get access token
    const tokens = await jwtClient.authorize();
    
    if (!tokens.access_token) {
      throw new Error('Failed to obtain access token');
    }

    // Decode the JWS token using Google's endpoint
    const response = await axios.post(
      `https://playintegrity.googleapis.com/v1/${expectedPackageName}:decodeIntegrityToken`,
      {
        integrityToken: token,
      },
      {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = response.data.tokenPayloadExternal as PlayIntegrityResponse;

    // Validate that the response package name matches expected
    if (result.appIntegrity?.packageName && result.appIntegrity.packageName !== expectedPackageName) {
      throw new Error(`Package name mismatch: expected ${expectedPackageName}, got ${result.appIntegrity.packageName}`);
    }

    if (result.requestDetails?.requestPackageName && result.requestDetails.requestPackageName !== expectedPackageName) {
      throw new Error(`Request package name mismatch: expected ${expectedPackageName}, got ${result.requestDetails.requestPackageName}`);
    }

    return result;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Play Integrity verification failed: ${error.response?.data?.error?.message || error.message}`);
    }
    throw new Error(`Play Integrity verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}