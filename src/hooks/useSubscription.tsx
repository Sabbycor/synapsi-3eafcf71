import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionStatus = "trial" | "active_premium" | "expired" | "cancelled";

interface SubscriptionContextType {
  status: SubscriptionStatus;
  trialEndDate: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
  isPremium: boolean;
  isPaywalled: boolean;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const PLANS = {
  monthly: {
    priceId: "price_1TIstn4YP81GnbXBej2ZXPnx",
    productId: "prod_UHRniacwYFqCWR",
    label: "Mensile",
    price: "€14,99/mese",
    amount: 14.99,
  },
  annual: {
    priceId: "price_1TIsu74YP81GnbXBH8xFvXsn",
    productId: "prod_UHRn1dkBJqvx6O",
    label: "Annuale",
    price: "€119/anno",
    amount: 119,
    savings: "Risparmi il 34%",
  },
} as const;

export { PLANS };

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>("trial");
  const [trialEndDate, setTrialEndDate] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!error && data) {
        setStatus(data.subscription_status ?? "trial");
        setTrialEndDate(data.trial_end_date ?? null);
        setSubscriptionEnd(data.subscription_end ?? null);
      }
    } catch (e) {
      console.error("Failed to check subscription:", e);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    refresh();
    // Auto-refresh every 60 seconds
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const isPremium = status === "active_premium";
  const isPaywalled = status === "expired" || status === "cancelled";

  return (
    <SubscriptionContext.Provider value={{ status, trialEndDate, subscriptionEnd, loading, isPremium, isPaywalled, refresh }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error("useSubscription must be used within SubscriptionProvider");
  return context;
}
