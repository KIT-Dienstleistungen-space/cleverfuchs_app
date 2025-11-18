import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { SubscriptionInfo } from "@/types/subscription";
import { trpcClient } from "@/lib/trpc";

/**
 * This service encapsulates the platform-specific purchase flow. On iOS and Android we
 * rely on Expo's In-App-Purchases API for initiating and restoring transactions. For
 * preview builds (web/tests) we fall back to an in-memory mock adapter so the rest of
 * the app can exercise the same code paths. Every receipt is forwarded to the backend,
 * which mimics a RevenueCat-style verification endpoint to persist the subscription
 * state and emit webhook-style updates.
 */

const DEVICE_ID_KEY = "iap_device_id";
const DEFAULT_PRODUCT_IDS = {
  ios: "com.cleverfuchs.premium.monthly",
  android: "cleverfuchs_premium_monthly",
  web: "cleverfuchs_web_monthly",
} as const;

const getEnvironment = (): "sandbox" | "production" =>
  process.env.EXPO_PUBLIC_IAP_ENVIRONMENT === "production"
    ? "production"
    : "sandbox";

type PlatformName = "ios" | "android" | "web";

export interface NormalizedPurchase {
  productId: string;
  transactionId: string;
  receipt: string;
  platform: PlatformName;
  environment: "sandbox" | "production";
}

interface PurchaseAdapter {
  connectAsync(): Promise<void>;
  purchaseItemAsync(productId: string): Promise<NormalizedPurchase>;
  restorePurchasesAsync(): Promise<NormalizedPurchase[]>;
  disconnectAsync(): Promise<void>;
}

class MockPurchaseAdapter implements PurchaseAdapter {
  private purchases: NormalizedPurchase[] = [];

  async connectAsync(): Promise<void> {
    return Promise.resolve();
  }

  async purchaseItemAsync(productId: string): Promise<NormalizedPurchase> {
    const purchase: NormalizedPurchase = {
      productId,
      platform: "web",
      environment: getEnvironment(),
      transactionId: `mock-${Date.now()}`,
      receipt: encodeReceipt(`receipt-${productId}-${Date.now()}`),
    };
    this.purchases.push(purchase);
    return purchase;
  }

  async restorePurchasesAsync(): Promise<NormalizedPurchase[]> {
    return [...this.purchases];
  }

  async disconnectAsync(): Promise<void> {
    return Promise.resolve();
  }
}

class ExpoPurchaseAdapter implements PurchaseAdapter {
  private platform: PlatformName;
  private module: typeof import("expo-in-app-purchases") | null = null;
  private loader?: Promise<typeof import("expo-in-app-purchases") | null>;

  constructor(platform: PlatformName) {
    this.platform = platform;
  }

  private async getModule() {
    if (this.module) {
      return this.module;
    }
    if (!this.loader) {
      this.loader = (async () => {
        try {
          return await import("expo-in-app-purchases");
        } catch (error) {
          console.warn(
            "expo-in-app-purchases konnte nicht geladen werden, fallback auf Mock",
            error
          );
          return null;
        }
      })();
    }
    this.module = await this.loader;
    return this.module;
  }

  async connectAsync(): Promise<void> {
    const mod = await this.getModule();
    if (!mod) {
      throw new Error("expo-in-app-purchases ist nicht verfügbar");
    }
    await mod.connectAsync();
  }

  async purchaseItemAsync(productId: string): Promise<NormalizedPurchase> {
    const mod = await this.getModule();
    if (!mod) {
      throw new Error("expo-in-app-purchases ist nicht verfügbar");
    }
    await mod.purchaseItemAsync(productId);
    return this.fetchLatestPurchase(mod, productId);
  }

  async restorePurchasesAsync(): Promise<NormalizedPurchase[]> {
    const mod = await this.getModule();
    if (!mod) {
      return [];
    }
    const response = await mod.getPurchaseHistoryAsync(true);
    if (response.responseCode !== mod.IAPResponseCode.OK) {
      return [];
    }
    const normalized = response.results
      .filter((purchase) => Boolean(purchase.transactionReceipt || purchase.purchaseToken))
      .map((purchase) => normalizeExpoPurchase(purchase, this.platform));
    await Promise.all(
      response.results.map((purchase) =>
        mod.finishTransactionAsync(purchase, false).catch(() => undefined)
      )
    );
    return normalized;
  }

  async disconnectAsync(): Promise<void> {
    const mod = await this.getModule();
    if (!mod) return;
    await mod.disconnectAsync();
  }

  private async fetchLatestPurchase(
    mod: typeof import("expo-in-app-purchases"),
    productId: string
  ): Promise<NormalizedPurchase> {
    const response = await mod.getPurchaseHistoryAsync(true);
    const relevant = response.results
      .filter((purchase) => purchase.productId === productId)
      .sort(
        (a, b) => (b.purchaseTime ?? 0) - (a.purchaseTime ?? 0)
      );

    const latest = relevant[0];
    if (!latest || (!latest.transactionReceipt && !latest.purchaseToken)) {
      throw new Error("Kein Kaufbeleg erhalten");
    }
    await mod.finishTransactionAsync(latest, false).catch(() => undefined);
    return normalizeExpoPurchase(latest, this.platform);
  }
}

const encodeReceipt = (payload: string): string => {
  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(payload);
  }
  const bufferFactory = (globalThis as any).Buffer;
  if (bufferFactory) {
    return bufferFactory.from(payload, "utf8").toString("base64");
  }
  return payload;
};

const normalizeExpoPurchase = (
  purchase: import("expo-in-app-purchases").Purchase,
  platform: PlatformName
): NormalizedPurchase => {
  const receipt =
    purchase.transactionReceipt ||
    purchase.purchaseToken ||
    encodeReceipt(`${purchase.productId}-${purchase.orderId ?? Date.now()}`);
  const transactionId =
    purchase.orderId ||
    purchase.transactionId ||
    purchase.purchaseToken ||
    `${purchase.productId}-${Date.now()}`;

  return {
    productId: purchase.productId,
    receipt,
    transactionId,
    platform,
    environment: getEnvironment(),
  };
};

const resolvePlatform = (): PlatformName => {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  return "web";
};

const createDefaultAdapter = (): PurchaseAdapter => {
  const platform = resolvePlatform();
  if (platform === "ios" || platform === "android") {
    return new ExpoPurchaseAdapter(platform);
  }
  return new MockPurchaseAdapter();
};

export interface VerifyReceiptResponse {
  subscription: SubscriptionInfo;
  message: string;
}

export class SubscriptionPurchaseService {
  private adapter: PurchaseAdapter;
  private initialized = false;
  private deviceIdPromise?: Promise<string>;

  constructor(adapter: PurchaseAdapter = createDefaultAdapter()) {
    this.adapter = adapter;
  }

  private async ensureReady() {
    if (this.initialized) {
      return;
    }
    await this.adapter.connectAsync();
    this.initialized = true;
  }

  async initialize() {
    await this.ensureReady();
  }

  async purchaseSubscription(): Promise<NormalizedPurchase> {
    await this.ensureReady();
    const productId = this.getProductIdentifier();
    return this.adapter.purchaseItemAsync(productId);
  }

  async restorePurchases(): Promise<NormalizedPurchase[]> {
    await this.ensureReady();
    return this.adapter.restorePurchasesAsync();
  }

  async verifyPurchaseWithBackend(
    purchase: NormalizedPurchase
  ): Promise<VerifyReceiptResponse> {
    const deviceId = await this.getDeviceId();
    return trpcClient.mutation("subscription.verifyReceipt", {
      deviceId,
      platform: purchase.platform,
      productId: purchase.productId,
      receipt: purchase.receipt,
      transactionId: purchase.transactionId,
      environment: purchase.environment,
    });
  }

  async disconnect() {
    if (!this.initialized) {
      return;
    }
    await this.adapter.disconnectAsync();
    this.initialized = false;
  }

  private getProductIdentifier() {
    const platform = resolvePlatform();
    const envKey =
      platform === "ios"
        ? process.env.EXPO_PUBLIC_IOS_SUBSCRIPTION_ID
        : platform === "android"
        ? process.env.EXPO_PUBLIC_ANDROID_SUBSCRIPTION_ID
        : process.env.EXPO_PUBLIC_WEB_SUBSCRIPTION_ID;

    return envKey || DEFAULT_PRODUCT_IDS[platform];
  }

  private async getDeviceId(): Promise<string> {
    if (!this.deviceIdPromise) {
      this.deviceIdPromise = (async () => {
        const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
        if (existing) {
          return existing;
        }
        const newId = `device-${Date.now()}-${Math.random()
          .toString(16)
          .slice(2)}`;
        await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
        return newId;
      })();
    }
    return this.deviceIdPromise;
  }
}

export const subscriptionPurchaseService = new SubscriptionPurchaseService();
