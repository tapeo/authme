import crypto from "crypto";
import { appConfig } from "..";

const IV_LENGTH = 16;

export function encrypt(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(appConfig.auth.encryption_key, "hex");
  if (key.length !== 32) {
    throw new Error(
      "Invalid encryption key length. Must be 32 bytes (256 bits)."
    );
  }
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(text: string) {
  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift() || "", "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  const key = Buffer.from(appConfig.auth.encryption_key, "hex");
  if (key.length !== 32) {
    throw new Error(
      "Invalid encryption key length. Must be 32 bytes (256 bits)."
    );
  }
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
