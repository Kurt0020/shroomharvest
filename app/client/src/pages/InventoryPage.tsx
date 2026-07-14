import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Banner,
  Button,
  ButtonGroup,
  Card,
  DataTable,
  FormLayout,
  InlineStack,
  Modal,
  Page,
  Select,
  Spinner,
  Text,
  TextField,
  Toast,
} from "@shopify/polaris";
import {
  adjustStock,
  archiveInventory,
  fetchInventory,
  fetchSuppliers,
  unarchiveInventory,
  updateInventoryThresholds,
} from "../lib/api.js";
import type { InventoryRow, Supplier } from "../types/dashboard.js";

const STATUS_BADGE: Record<InventoryRow["inventory"]["status"], { tone: "success" | "warning" | "critical" | "info"; label: string }> = {
  in_stock: { tone: "success", label: "In stock" },
  low_stock: { tone: "warning", label: "Low stock" },
  out_of_stock: { tone: "critical", label: "Out of stock" },
  archived: { tone: "info", label: "Archived" },
};

export default function InventoryPage() {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [adjustTarget, setAdjustTarget] = useState<InventoryRow | null>(null);
  const [adjustDelta, setAdjustDelta] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  const [editTarget, setEditTarget] = useState<InventoryRow | null>(null);
  const [editReorderPoint, setEditReorderPoint] = useState("");
  const [editReorderQuantity, setEditReorderQuantity] = useState("");
  const [editLowStockThreshold, setEditLowStockThreshold] = useState("");
  const [editSupplierId, setEditSupplierId] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inventoryResult, suppliersResult] = await Promise.all([fetchInventory(), fetchSuppliers()]);
      setRows(inventoryResult.data);
      setSuppliers(suppliersResult.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAdjustModal(row: InventoryRow) {
    setAdjustTarget(row);
    setAdjustDelta("");
    setAdjustNote("");
  }

  async function submitAdjust() {
    if (!adjustTarget) return;
    const delta = Number(adjustDelta);
    if (!Number.isInteger(delta) || delta === 0) {
      setError("Enter a non-zero whole number.");
      return;
    }
    try {
      await adjustStock(adjustTarget.inventory.id, delta, adjustNote || undefined);
      setToast(`Stock updated for ${adjustTarget.product.title}.`);
      setAdjustTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to adjust stock.");
    }
  }

  function openEditModal(row: InventoryRow) {
    setEditTarget(row);
    setEditReorderPoint(String(row.inventory.reorderPoint));
    setEditReorderQuantity(String(row.inventory.reorderQuantity));
    setEditLowStockThreshold(String(row.inventory.lowStockThreshold));
    setEditSupplierId(row.supplier ? String(row.supplier.id) : "");
  }

  async function submitEdit() {
    if (!editTarget) return;
    try {
      await updateInventoryThresholds(editTarget.inventory.id, {
        reorderPoint: Number(editReorderPoint),
        reorderQuantity: Number(editReorderQuantity),
        lowStockThreshold: Number(editLowStockThreshold),
        supplierId: editSupplierId ? Number(editSupplierId) : null,
      });
      setToast(`Thresholds updated for ${editTarget.product.title}.`);
      setEditTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update thresholds.");
    }
  }

  async function toggleArchive(row: InventoryRow) {
    try {
      if (row.inventory.status === "archived") {
        await unarchiveInventory(row.inventory.id);
        setToast(`${row.product.title} restored.`);
      } else {
        await archiveInventory(row.inventory.id);
        setToast(`${row.product.title} archived.`);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update archive status.");
    }
  }

  if (loading) {
    return (
      <Page title="Inventory">
        <InlineStack align="center">
          <Spinner accessibilityLabel="Loading inventory" size="large" />
        </InlineStack>
      </Page>
    );
  }

  const tableRows = rows.map((row) => [
    row.product.title,
    row.product.sku ?? "—",
    String(row.inventory.quantityOnHand),
    <Badge key={`badge-${row.inventory.id}`} tone={STATUS_BADGE[row.inventory.status].tone}>
      {STATUS_BADGE[row.inventory.status].label}
    </Badge>,
    row.supplier?.name ?? "—",
    <ButtonGroup key={`actions-${row.inventory.id}`}>
      <Button size="slim" onClick={() => openAdjustModal(row)} disabled={row.inventory.status === "archived"}>
        Adjust
      </Button>
      <Button size="slim" onClick={() => openEditModal(row)} disabled={row.inventory.status === "archived"}>
        Thresholds
      </Button>
      <Button size="slim" tone="critical" onClick={() => toggleArchive(row)}>
        {row.inventory.status === "archived" ? "Restore" : "Archive"}
      </Button>
    </ButtonGroup>,
  ]);

  return (
    <Page title="Inventory" subtitle="Adjust stock, edit thresholds, and archive discontinued items.">
      {error && (
        <div style={{ marginBottom: "1rem" }}>
          <Banner tone="critical" title="Something went wrong" onDismiss={() => setError(null)}>
            <p>{error}</p>
          </Banner>
        </div>
      )}

      <Card>
        {rows.length === 0 ? (
          <Text as="p" tone="subdued">
            No inventory yet — create a product via the API to see it here.
          </Text>
        ) : (
          <DataTable
            columnContentTypes={["text", "text", "numeric", "text", "text", "text"]}
            headings={["Product", "SKU", "Qty", "Status", "Supplier", "Actions"]}
            rows={tableRows}
          />
        )}
      </Card>

      {adjustTarget && (
        <Modal
          open
          onClose={() => setAdjustTarget(null)}
          title={`Adjust stock — ${adjustTarget.product.title}`}
          primaryAction={{ content: "Save", onAction: submitAdjust }}
          secondaryActions={[{ content: "Cancel", onAction: () => setAdjustTarget(null) }]}
        >
          <Modal.Section>
            <FormLayout>
              <TextField
                label="Delta (positive = restock, negative = sale/loss)"
                type="number"
                value={adjustDelta}
                onChange={setAdjustDelta}
                autoComplete="off"
              />
              <TextField label="Note (optional)" value={adjustNote} onChange={setAdjustNote} autoComplete="off" multiline={2} />
            </FormLayout>
          </Modal.Section>
        </Modal>
      )}

      {editTarget && (
        <Modal
          open
          onClose={() => setEditTarget(null)}
          title={`Edit thresholds — ${editTarget.product.title}`}
          primaryAction={{ content: "Save", onAction: submitEdit }}
          secondaryActions={[{ content: "Cancel", onAction: () => setEditTarget(null) }]}
        >
          <Modal.Section>
            <FormLayout>
              <TextField
                label="Reorder point"
                type="number"
                value={editReorderPoint}
                onChange={setEditReorderPoint}
                autoComplete="off"
              />
              <TextField
                label="Reorder quantity"
                type="number"
                value={editReorderQuantity}
                onChange={setEditReorderQuantity}
                autoComplete="off"
              />
              <TextField
                label="Low stock threshold"
                type="number"
                value={editLowStockThreshold}
                onChange={setEditLowStockThreshold}
                autoComplete="off"
              />
              <Select
                label="Supplier"
                options={[{ label: "None", value: "" }, ...suppliers.map((s) => ({ label: s.name, value: String(s.id) }))]}
                value={editSupplierId}
                onChange={setEditSupplierId}
              />
            </FormLayout>
          </Modal.Section>
        </Modal>
      )}

      {toast && <Toast content={toast} onDismiss={() => setToast(null)} />}
    </Page>
  );
}
