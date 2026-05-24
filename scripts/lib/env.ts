import dotenv from "dotenv";

dotenv.config();

export function getEnv(name: string): string | undefined {
  return process.env[name];
}

export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

