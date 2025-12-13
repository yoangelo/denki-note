import { Badge } from "./ui";
import type { BadgeVariant } from "./ui";

type InvoiceStatus = "draft" | "issued" | "canceled";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus | string;
}

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; variant: BadgeVariant }> = {
  draft: { label: "下書き", variant: "gray" },
  issued: { label: "発行済み", variant: "primary" },
  canceled: { label: "取消済み", variant: "danger" },
};

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const config = STATUS_CONFIG[status as InvoiceStatus] || {
    label: status,
    variant: "gray" as BadgeVariant,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
