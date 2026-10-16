import { getBusinessKycEncryptionSecret } from "@/lib/business-kyc-secret";

function getKeyBytes() {
  const secret = getBusinessKycEncryptionSecret().trim();
  if (!/^[0-9a-fA-F]{64}$/.test(secret)) {
    throw new Error("Business verification encryption is not configured.");
  }
  return Uint8Array.from(secret.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16));
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function getCryptoKey(usage: KeyUsage[]) {
  return crypto.subtle.importKey("raw", getKeyBytes(), { name: "AES-GCM" }, false, usage);
}

export async function encryptOwnerAadhaar(aadhaarNumber: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getCryptoKey(["encrypt"]);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(aadhaarNumber)
  );
  return `v1.${toBase64(iv)}.${toBase64(new Uint8Array(encrypted))}`;
}

export async function decryptOwnerAadhaar(ciphertext: string) {
  const [version, ivValue, encryptedValue] = ciphertext.split(".");
  if (version !== "v1" || !ivValue || !encryptedValue) {
    throw new Error("Unsupported business verification data format.");
  }

  const key = await getCryptoKey(["decrypt"]);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(ivValue) },
    key,
    fromBase64(encryptedValue)
  );
  return new TextDecoder().decode(decrypted);
}
