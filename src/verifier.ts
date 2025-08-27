import { GoogleAuth } from 'google-auth-library';
import { playintegrity_v1 } from '@googleapis/playintegrity';

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

    // Create Google Auth client with service account credentials
    const auth = new GoogleAuth({
      credentials: {
        client_email: credentials.clientEmail,
        private_key: credentials.privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/playintegrity'],
    });

    // Create Play Integrity API client
    const playIntegrity = new playintegrity_v1.Playintegrity({
      auth: auth as any,
    });

    // Decode the integrity token using the official Google API client
    const response = await playIntegrity.v1.decodeIntegrityToken({
      packageName: expectedPackageName,
      requestBody: {
        integrityToken: token,
      },
    });

    if (!response.data.tokenPayloadExternal) {
      throw new Error('No token payload received from Play Integrity API');
    }

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
    if (error instanceof Error) {
      throw new Error(`Play Integrity verification failed: ${error.message}`);
    }
    throw new Error(`Play Integrity verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}