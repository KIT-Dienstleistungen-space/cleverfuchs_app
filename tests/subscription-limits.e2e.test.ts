import { describe, expect, it } from "bun:test";
import { SUBSCRIPTION_LIMITS } from "@/lib/subscription/limits";
import {
  canCreateProfileWithLimits,
  canSendMessageWithStats,
  canUploadImageWithStats,
  incrementImageUsage,
  incrementMessageUsage,
  normalizeUsageStats,
} from "@/lib/subscription/usage";
import type { UsageStats } from "@/types/subscription";

describe("E2E: Subscription boundaries", () => {
  const baseStats: UsageStats = {
    messagesToday: 0,
    imagesUploadedToday: {},
    lastResetDate: new Date().toDateString(),
  };

  it("prevents creating more profiles than allowed for free tier", () => {
    const freeLimits = SUBSCRIPTION_LIMITS.free;
    expect(canCreateProfileWithLimits(freeLimits, freeLimits.maxProfiles)).toBe(
      false
    );
    expect(canCreateProfileWithLimits(freeLimits, freeLimits.maxProfiles - 1)).toBe(
      true
    );
  });

  it("enforces daily message limits for free tier but not for premium", () => {
    const freeLimits = SUBSCRIPTION_LIMITS.free;
    const premiumLimits = SUBSCRIPTION_LIMITS.premium;
    let stats = { ...baseStats };
    for (let i = 0; i < freeLimits.maxMessagesPerDay; i += 1) {
      stats = incrementMessageUsage(stats);
    }
    expect(canSendMessageWithStats(stats, freeLimits)).toBe(false);
    expect(canSendMessageWithStats(stats, premiumLimits)).toBe(true);
  });

  it("tracks image uploads per profile and resets on new day", () => {
    const freeLimits = SUBSCRIPTION_LIMITS.free;
    let stats = { ...baseStats };
    const profileId = "abc";
    for (let i = 0; i < freeLimits.maxImagesPerProfilePerDay; i += 1) {
      stats = incrementImageUsage(stats, profileId);
    }
    expect(canUploadImageWithStats(stats, freeLimits, profileId)).toBe(false);

    const nextDayStats = normalizeUsageStats({
      ...stats,
      lastResetDate: "Gestern",
    });
    expect(canUploadImageWithStats(nextDayStats, freeLimits, profileId)).toBe(true);
  });
});
