import { createCipheriv, createDecipheriv } from "crypto";

export interface EncryptedData {
  iv: string;
  encryptedData: string;
}

function ensureKeyLength(key: string): Buffer {
  const keyBuffer = Buffer.from(key, "utf-8");
  if (keyBuffer.length < 32) {
    const paddedKey = Buffer.alloc(32);
    keyBuffer.copy(paddedKey);
    return paddedKey;
  }
  if (keyBuffer.length > 32) {
    return keyBuffer.slice(0, 32);
  }
  return keyBuffer;
}

function encrypt(text: any, key: string): EncryptedData {
  const iv = Buffer.from("your-16-byte-key", "utf-8").slice(0, 16);
  const cipher = createCipheriv("aes-256-cbc", ensureKeyLength(key), iv);
  let encrypted = cipher.update(JSON.stringify(text), "utf-8", "hex");
  encrypted += cipher.final("hex");
  return { iv: iv.toString("hex"), encryptedData: encrypted };
}

function decrypt(encryptedData: EncryptedData, key: string): any {
  const iv = Buffer.from(encryptedData.iv, "hex");
  const decipher = createDecipheriv("aes-256-cbc", ensureKeyLength(key), iv);
  let decrypted = decipher.update(encryptedData.encryptedData, "hex", "utf-8");
  decrypted += decipher.final("utf-8");
  return JSON.parse(decrypted);
}

export { encrypt, decrypt };
