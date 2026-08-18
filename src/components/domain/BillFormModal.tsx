"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import type { Bill, BillCategory } from "@/lib/types";

const CATEGORIES: BillCategory[] = [
  "School Fees",
  "Clothing",
  "Feeding",
  "Books",
  "Medical",
  "Miscellaneous",
];

export interface BillFormValue {
  name: string;
  category: BillCategory;
  total: string;
  dueDate: string;
  description: string;
}

/** Add / Edit Bill modal (PRD §4.4). Validates amount > 0. */
export function BillFormModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (value: BillFormValue) => void;
  initial?: Bill | null;
}) {
  const [value, setValue] = useState<BillFormValue>({
    name: "",
    category: "School Fees",
    total: "",
    dueDate: "",
    description: "",
  });
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (initial) {
      setValue({
        name: initial.name,
        category: initial.category,
        total: String(initial.total),
        dueDate: initial.dueDate,
        description: initial.description ?? "",
      });
    } else {
      setValue({ name: "", category: "School Fees", total: "", dueDate: "", description: "" });
    }
    setError(undefined);
  }, [initial, open]);

  function save() {
    if (!value.name.trim()) return setError("Please enter a bill name.");
    if (Number(value.total) <= 0) return setError("Total amount must be greater than 0.");
    if (!value.dueDate) return setError("Please choose a due date.");
    onSave(value);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Bill" : "Add New Bill"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>{initial ? "Save changes" : "Add bill"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Bill name"
          required
          value={value.name}
          onChange={(e) => setValue((v) => ({ ...v, name: e.target.value }))}
          placeholder="School Fees — Session 2026"
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Category"
            value={value.category}
            onChange={(e) => setValue((v) => ({ ...v, category: e.target.value as BillCategory }))}
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
          <Input
            label="Total amount"
            type="number"
            min={1}
            required
            value={value.total}
            onChange={(e) => setValue((v) => ({ ...v, total: e.target.value }))}
            placeholder="1200"
          />
        </div>
        <Input
          label="Due date"
          type="date"
          required
          value={value.dueDate}
          onChange={(e) => setValue((v) => ({ ...v, dueDate: e.target.value }))}
        />
        <Textarea
          label="Description (optional)"
          value={value.description}
          onChange={(e) => setValue((v) => ({ ...v, description: e.target.value }))}
          placeholder="What is this bill for?"
          rows={3}
        />
        {error && <p className="text-caption text-alert">{error}</p>}
      </div>
    </Modal>
  );
}
