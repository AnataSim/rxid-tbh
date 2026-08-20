/**
 * 🔒 Enterprise Payload Data Security System
 * - AES-256-GCM Encryption & Decryption for Sensitive Payloads
 * - HMAC-SHA256 Request Signature & Timestamp Authentication
 * 
 * Powered by native Web Crypto API (crypto.subtle)
 */

const DEFAULT_AES_KEY_HEX  = '03a68d712f5b894109c12e8471fa0919318b762514d23e80f931d872fa9102c4';
const DEFAULT_HMAC_KEY_HEX = '9f81a7b45c23d091e847f129a03b5890b2176451c890d234e7104b68ef219a4d';

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export interface EncryptedPayloadBundle {
  ciphertext: string;
  iv: string;
  algorithm: 'AES-256-GCM';
  timestamp: number;
}

export interface AuthenticatedRequestHeaders {
  'X-Signature-Algorithm': 'HMAC-SHA256';
  'X-Request-Timestamp': string;
  'X-Request-Signature': string;
  'X-Content-Encrypted': 'true';
}

/**
 * Encrypts sensitive data using AES-256-GCM with a 96-bit random IV.
 */
export async function encryptPayloadAES256GCM(
  data: Record<string, any> | string,
  secretKeyHex: string = DEFAULT_AES_KEY_HEX
): Promise<EncryptedPayloadBundle> {
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(jsonString);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyBytes = hexToBytes(secretKeyHex);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer, tagLength: 128 },
    cryptoKey,
    dataBytes.buffer as ArrayBuffer
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bytesToHex(iv),
    algorithm: 'AES-256-GCM',
    timestamp: Date.now(),
  };
}

/**
 * Decrypts an AES-256-GCM encrypted payload bundle.
 */
export async function decryptPayloadAES256GCM<T = any>(
  bundle: EncryptedPayloadBundle,
  secretKeyHex: string = DEFAULT_AES_KEY_HEX
): Promise<T> {
  const iv = hexToBytes(bundle.iv);
  const encryptedBytes = base64ToBytes(bundle.ciphertext);
  const keyBytes = hexToBytes(secretKeyHex);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer, tagLength: 128 },
    cryptoKey,
    encryptedBytes.buffer as ArrayBuffer
  );

  const decoder = new TextDecoder();
  const jsonString = decoder.decode(decryptedBuffer);

  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return jsonString as unknown as T;
  }
}

/**
 * Generates an HMAC-SHA256 signature for request payload + timestamp.
 */
export async function generateHMACSignature(
  payloadString: string,
  timestampMs: number,
  secretKeyHex: string = DEFAULT_HMAC_KEY_HEX
): Promise<string> {
  const message = `${timestampMs}:${payloadString}`;
  const encoder = new TextEncoder();
  const messageBytes = encoder.encode(message);
  const keyBytes = hexToBytes(secretKeyHex);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageBytes.buffer as ArrayBuffer);
  return bytesToHex(new Uint8Array(signatureBuffer));
}

/**
 * Verifies an incoming HMAC-SHA256 signature.
 */
export async function verifyHMACSignature(
  payloadString: string,
  timestampMs: number,
  signatureToVerify: string,
  secretKeyHex: string = DEFAULT_HMAC_KEY_HEX,
  maxAgeMs: number = 300000
): Promise<boolean> {
  const age = Math.abs(Date.now() - timestampMs);
  if (age > maxAgeMs) {
    console.warn('HMAC Signature expired (anti-replay check):', age, 'ms');
    return false;
  }

  const expectedSignature = await generateHMACSignature(payloadString, timestampMs, secretKeyHex);
  return expectedSignature.toLowerCase() === signatureToVerify.toLowerCase();
}

/**
 * Creates authenticated request headers with AES-256-GCM payload encryption + HMAC-SHA256 signature.
 */
export async function buildSecurePayloadBundle(data: Record<string, any>): Promise<{
  encryptedPayload: EncryptedPayloadBundle;
  headers: AuthenticatedRequestHeaders;
}> {
  const encryptedPayload = await encryptPayloadAES256GCM(data);
  const payloadString = JSON.stringify(encryptedPayload);
  const timestamp = Date.now();
  const signature = await generateHMACSignature(payloadString, timestamp);

  return {
    encryptedPayload,
    headers: {
      'X-Signature-Algorithm': 'HMAC-SHA256',
      'X-Request-Timestamp': timestamp.toString(),
      'X-Request-Signature': signature,
      'X-Content-Encrypted': 'true',
    },
  };
}
