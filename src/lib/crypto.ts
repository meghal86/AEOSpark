import crypto from "node:crypto";

import { appEnv, assertProductionEncryptionConfig } from "@/lib/env";

function deriveKey() {
  assertProductionEncryptionConfig();
  return crypto
    .createHash("sha256")
    .update(appEnv.encryptionKey)
    .digest();
}

export function encryptSecret(value: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", deriveKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSecret(value: string) {
  const [ivHex, encryptedHex] = value.split(":");
  if (!ivHex || !encryptedHex) {
    return "";
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    deriveKey(),
    Buffer.from(ivHex, "hex"),
  );
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
