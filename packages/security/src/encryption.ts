import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

const getEncryptionKey = (): Buffer => {
  const secret =
    process.env.JWT_SECRET || "default-secret-change-in-production";
  return crypto.pbkdf2Sync(
    secret,
    "encryption-salt",
    ITERATIONS,
    KEY_LENGTH,
    "sha512",
  );
};

export interface EncryptionResult {
  encryptedData: string;
  iv: string;
  authTag: string;
  salt: string;
}

export const encryption = {
  encrypt(plainText: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag();

    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  },

  decrypt(encryptedText: string): string {
    const key = getEncryptionKey();
    const [ivHex, authTagHex, encrypted] = encryptedText.split(":");

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  },

  encryptField(fieldValue: string): string {
    if (!fieldValue) return "";
    return this.encrypt(fieldValue);
  },

  decryptField(encryptedValue: string): string {
    if (!encryptedValue) return "";
    try {
      return this.decrypt(encryptedValue);
    } catch {
      return "";
    }
  },

  hashPassword(password: string): { hash: string; salt: string } {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 64, "sha512");
    return {
      hash: hash.toString("hex"),
      salt: salt.toString("hex"),
    };
  },

  verifyPassword(password: string, hash: string, salt: string): boolean {
    const saltBuffer = Buffer.from(salt, "hex");
    const hashBuffer = crypto.pbkdf2Sync(
      password,
      saltBuffer,
      ITERATIONS,
      64,
      "sha512",
    );
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), hashBuffer);
  },

  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString("hex");
  },

  generateApiKey(): string {
    return `wka_${this.generateSecureToken(48)}`;
  },
};

export default encryption;
