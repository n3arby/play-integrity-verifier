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
 * @returns Decoded and verified Play Integrity response
 */
export async function verifyPlayIntegrity(
  token: string,
  credentials: PlayIntegrityCredentials
): Promise<PlayIntegrityResponse> {
  try {
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
      'https://playintegrity.googleapis.com/v1:decodeIntegrityToken',
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

    return response.data.tokenPayloadExternal as PlayIntegrityResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Play Integrity verification failed: ${error.response?.data?.error?.message || error.message}`);
    }
    throw new Error(`Play Integrity verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}