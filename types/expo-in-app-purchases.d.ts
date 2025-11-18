declare module "expo-in-app-purchases" {
  export enum IAPResponseCode {
    OK = 0,
    USER_CANCELED = 1,
    SERVICE_UNAVAILABLE = 2,
    BILLING_UNAVAILABLE = 3,
    ITEM_UNAVAILABLE = 4,
    DEVELOPER_ERROR = 5,
    ERROR = 6,
  }

  export interface ProductDetails {
    productId: string;
    price: string;
    title?: string;
    description?: string;
  }

  export interface Purchase {
    productId: string;
    orderId?: string;
    purchaseToken?: string;
    transactionId?: string;
    transactionReceipt?: string | null;
    acknowledged?: boolean;
    purchaseTime?: number;
  }

  export interface ProductResponse {
    responseCode: IAPResponseCode;
    results: ProductDetails[];
  }

  export interface PurchaseResponse {
    responseCode: IAPResponseCode;
    results: Purchase[];
  }

  export type PurchaseListener = (response: PurchaseResponse) => void;

  export function connectAsync(): Promise<void>;
  export function disconnectAsync(): Promise<void>;
  export function getProductsAsync(
    productIds: string[]
  ): Promise<ProductResponse>;
  export function purchaseItemAsync(productId: string): Promise<void>;
  export function getPurchaseHistoryAsync(
    refresh?: boolean
  ): Promise<PurchaseResponse>;
  export function finishTransactionAsync(
    purchase: Purchase,
    consume?: boolean
  ): Promise<void>;
  export function setPurchaseListener(listener: PurchaseListener): void;
}
