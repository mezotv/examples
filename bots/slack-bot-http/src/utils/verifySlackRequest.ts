import { createHmac, timingSafeEqual } from "node:crypto";
import { SLACK_MAX_SIGNATURE_AGE_SECONDS, SLACK_SIGNATURE_VERSION } from "../constants/slack.js";
import type { VerifySlackRequestInput } from "../types/slack.js";

const isFreshTimestamp = (timestamp: string | null): timestamp is string => {
  if (!timestamp || !/^\d+$/.test(timestamp)) {
    return false;
  }

  const timestampSeconds = Number(timestamp);
  const nowSeconds = Math.floor(Date.now() / 1000);

  return Math.abs(nowSeconds - timestampSeconds) <= SLACK_MAX_SIGNATURE_AGE_SECONDS;
};

const createExpectedSignature = (signingSecret: string, timestamp: string, body: string): string => {
  const signatureBase = `${SLACK_SIGNATURE_VERSION}:${timestamp}:${body}`;
  const digest = createHmac("sha256", signingSecret).update(signatureBase).digest("hex");

  return `${SLACK_SIGNATURE_VERSION}=${digest}`;
};

export const verifySlackRequest = ({
  body,
  signingSecret,
  signature,
  timestamp,
}: VerifySlackRequestInput): boolean => {
  if (!signingSecret || !signature || !isFreshTimestamp(timestamp)) {
    return false;
  }

  const expectedSignature = createExpectedSignature(signingSecret, timestamp, body);
  const expected = Buffer.from(expectedSignature, "utf8");
  const received = Buffer.from(signature, "utf8");

  return expected.length === received.length && timingSafeEqual(expected, received);
};
