import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Banner,
  BlockStack,
  Button,
  Card,
  InlineStack,
  Page,
  Select,
  Spinner,
  Text,
  Toast,
} from "@shopify/polaris";
import { fetchRecommendations, generateRecommendations, resolveRecommendation } from "../lib/api.js";
import type { Recommendation } from "../types/dashboard.js";

const PRIORITY_TONE: Record<Recommendation["priority"], "critical" | "warning" | "info" | "success"> = {
  critical: "critical",
  high: "warning",
  medium: "info",
  low: "success",
};

const TYPE_LABELS: Record<Recommendation["type"], string> = {
  restock_urgent: "Restock urgent",
  restock_soon: "Restock soon",
  increase_before_demand: "Demand spike expected",
  reduce_reorder_quantity: "Reduce reorder quantity",
  supplier_lead_time_risk: "Supplier lead-time risk",
};

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [priority, setPriority] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRecommendations({ priority: priority || undefined });
      setRecommendations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recommendations.");
    } finally {
      setLoading(false);
    }
  }, [priority]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const result = await generateRecommendations();
      setToast(
        `${result.itemsScored} items scored — ${result.created} new recommendation${result.created === 1 ? "" : "s"}, ${result.resolved} resolved.`
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run the recommendation engine.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleResolve(rec: Recommendation) {
    try {
      await resolveRecommendation(rec.id);
      setToast("Recommendation dismissed.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve recommendation.");
    }
  }

  return (
    <Page
      title="Recommendations"
      subtitle="What the Inventory Health Score engine currently flags."
      primaryAction={{ content: "Refresh recommendations", onAction: handleGenerate, loading: generating }}
    >
      {error && (
        <div style={{ marginBottom: "1rem" }}>
          <Banner tone="critical" title="Something went wrong" onDismiss={() => setError(null)}>
            <p>{error}</p>
          </Banner>
        </div>
      )}

      <BlockStack gap="400">
        <Card>
          <div style={{ maxWidth: 240 }}>
            <Select
              label="Priority"
              options={[
                { label: "All", value: "" },
                { label: "Critical", value: "critical" },
                { label: "High", value: "high" },
                { label: "Medium", value: "medium" },
                { label: "Low", value: "low" },
              ]}
              value={priority}
              onChange={setPriority}
            />
          </div>
        </Card>

        {loading ? (
          <InlineStack align="center">
            <Spinner accessibilityLabel="Loading recommendations" size="large" />
          </InlineStack>
        ) : recommendations.length === 0 ? (
          <Card>
            <Text as="p" tone="subdued">
              No open recommendations right now. Try "Refresh recommendations" after adjusting stock to
              see the engine re-evaluate.
            </Text>
          </Card>
        ) : (
          <Card>
            <BlockStack gap="400">
              {recommendations.map((rec) => (
                <InlineStack key={rec.id} align="space-between" blockAlign="start" gap="300">
                  <BlockStack gap="100">
                    <InlineStack gap="200" blockAlign="center">
                      <Badge tone={PRIORITY_TONE[rec.priority]}>{rec.priority}</Badge>
                      <Text as="span" variant="bodySm" tone="subdued">
                        {TYPE_LABELS[rec.type]}
                        {rec.healthScoreAtGeneration !== null ? ` · score ${rec.healthScoreAtGeneration}` : ""}
                      </Text>
                    </InlineStack>
                    <Text as="p">{rec.message}</Text>
                  </BlockStack>
                  <Button size="slim" onClick={() => handleResolve(rec)}>
                    Dismiss
                  </Button>
                </InlineStack>
              ))}
            </BlockStack>
          </Card>
        )}
      </BlockStack>

      {toast && <Toast content={toast} onDismiss={() => setToast(null)} />}
    </Page>
  );
}
