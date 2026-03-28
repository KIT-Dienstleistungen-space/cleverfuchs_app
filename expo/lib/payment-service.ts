import { Platform } from "react-native";
import { trpcClient } from "@/lib/trpc";

const PRODUCT_IDS = {
  premium: "com.kinderapp.premium.monthly",
} as const;

export interface PurchaseResult {
  success: boolean;
  productId?: string;
  error?: string;
}

class PaymentService {
  async initializePurchases(): Promise<void> {
    if (Platform.OS === "web") {
      console.log("In-app purchases not available on web");
      return;
    }

    console.log("Payment service initialized");
  }

  async purchasePremium(): Promise<PurchaseResult> {
    try {
      if (Platform.OS === "web") {
        const response = await trpcClient.subscription.verify.mutate({
          productId: PRODUCT_IDS.premium,
          purchaseDate: Date.now(),
          platform: "web",
        });

        return {
          success: response.success,
          productId: PRODUCT_IDS.premium,
        };
      }

      console.log("Simulating purchase for development");
      
      await trpcClient.subscription.verify.mutate({
        productId: PRODUCT_IDS.premium,
        purchaseDate: Date.now(),
        platform: Platform.OS === "ios" ? "ios" : "android",
      });

      return {
        success: true,
        productId: PRODUCT_IDS.premium,
      };
    } catch (error: any) {
      console.error("Purchase error:", error);
      return {
        success: false,
        error: error.message || "Kaufvorgang fehlgeschlagen",
      };
    }
  }

  async restorePurchases(): Promise<PurchaseResult> {
    try {
      const status = await trpcClient.subscription.status.query();

      if (status.isActive && status.tier === "premium") {
        return {
          success: true,
          productId: PRODUCT_IDS.premium,
        };
      }

      return {
        success: false,
        error: "Keine aktiven Käufe gefunden",
      };
    } catch (error: any) {
      console.error("Restore error:", error);
      return {
        success: false,
        error: error.message || "Wiederherstellung fehlgeschlagen",
      };
    }
  }

  async cancelSubscription(): Promise<boolean> {
    try {
      await trpcClient.subscription.cancel.mutate();
      return true;
    } catch (error) {
      console.error("Cancel error:", error);
      return false;
    }
  }

  getProductIds() {
    return PRODUCT_IDS;
  }
}

export const paymentService = new PaymentService();
