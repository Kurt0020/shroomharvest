import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Banner,
  Button,
  Card,
  FormLayout,
  InlineStack,
  Modal,
  Page,
  ResourceItem,
  ResourceList,
  Spinner,
  Text,
  TextField,
  Toast,
} from "@shopify/polaris";
import { createSupplier, fetchSuppliers, updateSupplier } from "../lib/api.js";
import type { Supplier } from "../types/dashboard.js";

type SupplierFormState = {
  name: string;
  contactEmail: string;
  contactPhone: string;
  leadTimeDays: string;
  notes: string;
};

const EMPTY_FORM: SupplierFormState = { name: "", contactEmail: "", contactPhone: "", leadTimeDays: "7", notes: "" };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<SupplierFormState>(EMPTY_FORM);

  const [editTarget, setEditTarget] = useState<Supplier | null>(null);
  const [editForm, setEditForm] = useState<SupplierFormState>(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSuppliers();
      setSuppliers(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load suppliers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submitCreate() {
    if (!createForm.name.trim()) {
      setError("Supplier name is required.");
      return;
    }
    try {
      await createSupplier({
        name: createForm.name,
        contactEmail: createForm.contactEmail || undefined,
        contactPhone: createForm.contactPhone || undefined,
        leadTimeDays: createForm.leadTimeDays ? Number(createForm.leadTimeDays) : undefined,
        notes: createForm.notes || undefined,
      });
      setToast(`${createForm.name} added.`);
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create supplier.");
    }
  }

  function openEdit(supplier: Supplier) {
    setEditTarget(supplier);
    setEditForm({
      name: supplier.name,
      contactEmail: supplier.contactEmail ?? "",
      contactPhone: supplier.contactPhone ?? "",
      leadTimeDays: String(supplier.leadTimeDays),
      notes: supplier.notes ?? "",
    });
  }

  async function submitEdit() {
    if (!editTarget) return;
    try {
      await updateSupplier(editTarget.id, {
        name: editForm.name,
        contactEmail: editForm.contactEmail || undefined,
        contactPhone: editForm.contactPhone || undefined,
        leadTimeDays: editForm.leadTimeDays ? Number(editForm.leadTimeDays) : undefined,
        notes: editForm.notes || undefined,
      });
      setToast(`${editForm.name} updated.`);
      setEditTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update supplier.");
    }
  }

  async function toggleActive(supplier: Supplier) {
    try {
      await updateSupplier(supplier.id, { isActive: !supplier.isActive });
      setToast(supplier.isActive ? `${supplier.name} deactivated.` : `${supplier.name} reactivated.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update supplier.");
    }
  }

  if (loading) {
    return (
      <Page title="Suppliers">
        <InlineStack align="center">
          <Spinner accessibilityLabel="Loading suppliers" size="large" />
        </InlineStack>
      </Page>
    );
  }

  return (
    <Page
      title="Suppliers"
      subtitle="Manage who you source mushroom products from."
      primaryAction={{ content: "Add supplier", onAction: () => setCreateOpen(true) }}
    >
      {error && (
        <div style={{ marginBottom: "1rem" }}>
          <Banner tone="critical" title="Something went wrong" onDismiss={() => setError(null)}>
            <p>{error}</p>
          </Banner>
        </div>
      )}

      <Card>
        {suppliers.length === 0 ? (
          <Text as="p" tone="subdued">
            No suppliers yet — add one to get started.
          </Text>
        ) : (
          <ResourceList
            resourceName={{ singular: "supplier", plural: "suppliers" }}
            items={suppliers}
            renderItem={(supplier) => (
              <ResourceItem id={String(supplier.id)} onClick={() => {}}>
                <InlineStack align="space-between" blockAlign="center">
                  <div>
                    <Text as="p" fontWeight="medium">
                      {supplier.name}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {supplier.contactEmail ?? "No email"} · {supplier.leadTimeDays}-day lead time
                    </Text>
                  </div>
                  <InlineStack gap="200" blockAlign="center">
                    <Badge tone={supplier.isActive ? "success" : "info"}>
                      {supplier.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button size="slim" onClick={() => openEdit(supplier)}>
                      Edit
                    </Button>
                    <Button size="slim" onClick={() => toggleActive(supplier)}>
                      {supplier.isActive ? "Deactivate" : "Reactivate"}
                    </Button>
                  </InlineStack>
                </InlineStack>
              </ResourceItem>
            )}
          />
        )}
      </Card>

      {createOpen && (
        <Modal
          open
          onClose={() => setCreateOpen(false)}
          title="Add supplier"
          primaryAction={{ content: "Add", onAction: submitCreate }}
          secondaryActions={[{ content: "Cancel", onAction: () => setCreateOpen(false) }]}
        >
          <Modal.Section>
            <SupplierForm form={createForm} onChange={setCreateForm} />
          </Modal.Section>
        </Modal>
      )}

      {editTarget && (
        <Modal
          open
          onClose={() => setEditTarget(null)}
          title={`Edit — ${editTarget.name}`}
          primaryAction={{ content: "Save", onAction: submitEdit }}
          secondaryActions={[{ content: "Cancel", onAction: () => setEditTarget(null) }]}
        >
          <Modal.Section>
            <SupplierForm form={editForm} onChange={setEditForm} />
          </Modal.Section>
        </Modal>
      )}

      {toast && <Toast content={toast} onDismiss={() => setToast(null)} />}
    </Page>
  );
}

function SupplierForm({
  form,
  onChange,
}: {
  form: SupplierFormState;
  onChange: (form: SupplierFormState) => void;
}) {
  return (
    <FormLayout>
      <TextField label="Name" value={form.name} onChange={(v) => onChange({ ...form, name: v })} autoComplete="off" />
      <TextField
        label="Contact email"
        type="email"
        value={form.contactEmail}
        onChange={(v) => onChange({ ...form, contactEmail: v })}
        autoComplete="off"
      />
      <TextField
        label="Contact phone"
        value={form.contactPhone}
        onChange={(v) => onChange({ ...form, contactPhone: v })}
        autoComplete="off"
      />
      <TextField
        label="Lead time (days)"
        type="number"
        value={form.leadTimeDays}
        onChange={(v) => onChange({ ...form, leadTimeDays: v })}
        autoComplete="off"
      />
      <TextField
        label="Notes"
        value={form.notes}
        onChange={(v) => onChange({ ...form, notes: v })}
        autoComplete="off"
        multiline={3}
      />
    </FormLayout>
  );
}
