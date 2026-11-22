import { createHash, createHmac } from "node:crypto";

/** AWS Signature V4 for S3-compatible storage (AWS S3, Cloudflare R2, MinIO). No SDK needed. */

const sha256 = (data: string | Buffer) => createHash("sha256").update(data).digest("hex");
const hmac = (key: Buffer | string, data: string) => createHmac("sha256", key).update(data).digest();

export const EMPTY_SHA256 = sha256("");

export type SignInput = {
  method: "GET" | "PUT" | "HEAD" | "DELETE";
  url: URL;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  headers?: Record<string, string>;
  payloadHash?: string;
  /** For tests; defaults to now. */
  date?: Date;
};

const encodePath = (p: string) => p.split("/").map((s) => encodeURIComponent(decodeURIComponent(s))).join("/");

export function signRequest(i: SignInput): Record<string, string> {
  const d = i.date ?? new Date();
  const amzDate = d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const day = amzDate.slice(0, 8);
  const payloadHash = i.payloadHash ?? EMPTY_SHA256;
  const headers: Record<string, string> = {
    ...Object.fromEntries(Object.entries(i.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v.trim()])),
    host: i.url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  const names = Object.keys(headers).sort();
  const canonicalQuery = [...i.url.searchParams.entries()]
    .map(([k, v]) => [encodeURIComponent(k), encodeURIComponent(v)])
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const canonical = [i.method, encodePath(i.url.pathname), canonicalQuery, ...names.map((n) => `${n}:${headers[n]}`), "", names.join(";"), payloadHash].join("\n");
  const scope = `${day}/${i.region}/s3/aws4_request`;
  const toSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonical)].join("\n");
  const key = hmac(hmac(hmac(hmac(`AWS4${i.secretAccessKey}`, day), i.region), "s3"), "aws4_request");
  const signature = createHmac("sha256", key).update(toSign).digest("hex");
  return {
    ...headers,
    authorization: `AWS4-HMAC-SHA256 Credential=${i.accessKeyId}/${scope}, SignedHeaders=${names.join(";")}, Signature=${signature}`,
  };
}

export function payloadSha256(buf: Buffer) {
  return sha256(buf);
}
