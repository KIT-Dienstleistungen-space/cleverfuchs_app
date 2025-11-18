import { createHash } from "node:crypto";
import { SubscriptionInfo } from "@/types/subscription";

export interface StoredSubscription extends SubscriptionInfo {
  deviceId: string;
  receiptHash: string;
  productId: string;
  transactionId: string;
}

const subscriptionsByDevice = new Map<string, StoredSubscription>();

export const hashReceipt = (receipt: string) =>
  createHash("sha256").update(receipt).digest("hex");

export const persistSubscriptionRecord = (
  record: Omit<StoredSubscription, "verifiedAt"> & { verifiedAt?: number }
): StoredSubscription => {
  const stored: StoredSubscription = {
    ...record,
    verifiedAt: record.verifiedAt ?? Date.now(),
  };
  subscriptionsByDevice.set(stored.deviceId, stored);
  return stored;
};

export const findSubscriptionByDevice = (deviceId: string) =>
  subscriptionsByDevice.get(deviceId);

export const findSubscriptionByTransaction = (transactionId: string) => {
  for (const stored of subscriptionsByDevice.values()) {
    if (stored.transactionId === transactionId) {
      return stored;
    }
  }
  return undefined;
};

export const updateSubscriptionFromWebhook = (params: {
  deviceId?: string;
  transactionId?: string;
  status: SubscriptionInfo["status"];
  expiresAt?: number;
}): StoredSubscription | null => {
  const current = params.deviceId
    ? subscriptionsByDevice.get(params.deviceId)
    : params.transactionId
    ? findSubscriptionByTransaction(params.transactionId)
    : undefined;

  if (!current) {
    return null;
  }

  const updated: StoredSubscription = {
    ...current,
    status: params.status,
    expiresAt: params.expiresAt ?? current.expiresAt,
    verifiedAt: Date.now(),
  };

  subscriptionsByDevice.set(updated.deviceId, updated);
  return updated;
};
