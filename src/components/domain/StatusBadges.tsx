import { Badge } from "@/components/ui/Badge";
import { CheckCircleIcon, RepeatIcon } from "@/components/ui/icons";
import type { BillStatus, PaymentStatus, VerificationStatus } from "@/lib/types";

export function BillStatusBadge({ status }: { status: BillStatus }) {
  switch (status) {
    case "Fully Funded":
      return <Badge tone="success" icon={<CheckCircleIcon size={12} />}>Fully Funded</Badge>;
    case "Overdue":
      return <Badge tone="alert">Overdue</Badge>;
    case "Archived":
      return <Badge tone="neutral">Archived</Badge>;
    default:
      return <Badge tone="gold">Active</Badge>;
  }
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  // PRD §4.5 — green pill Confirmed, amber Pending, red Failed.
  switch (status) {
    case "Confirmed":
      return <Badge tone="success">Confirmed</Badge>;
    case "Pending":
      return <Badge tone="amber">Pending</Badge>;
    case "Failed":
      return <Badge tone="alert">Failed</Badge>;
  }
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  switch (status) {
    case "Verified":
      return <Badge tone="success" icon={<CheckCircleIcon size={12} />}>Verified</Badge>;
    case "Rejected":
      return <Badge tone="alert">Rejected</Badge>;
    case "Suspended":
      return <Badge tone="alert">Suspended</Badge>;
    default:
      return <Badge tone="amber">Pending Verification</Badge>;
  }
}

export function RecurringBadge() {
  return <Badge tone="accent" icon={<RepeatIcon size={12} />}>Recurring</Badge>;
}
