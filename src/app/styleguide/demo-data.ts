/**
 * Static demo data for the styleguide — mirrors supabase/seed.sql
 * (RizzFitt Sports Club → RizzFitt Pickleball Open 2026).
 */
import type { EntryStatus, PaymentStatus } from "@/lib/domain/enums";

export interface DemoEntry {
  id: string;
  player: string;
  category: string;
  status: EntryStatus;
  amountInr: number;
  createdAt: string;
}

export const demoEntries: DemoEntry[] = [
  {
    id: "ENT-0001",
    player: "Rohan Iyer",
    category: "Men's Singles — Open",
    status: "confirmed",
    amountInr: 799,
    createdAt: "2026-06-02",
  },
  {
    id: "ENT-0002",
    player: "Meera Nair",
    category: "Men's Singles — Open",
    status: "pending_payment",
    amountInr: 799,
    createdAt: "2026-06-03",
  },
  {
    id: "ENT-0003",
    player: "Arjun Menon",
    category: "Mixed Doubles — Open",
    status: "pending_partner",
    amountInr: 1199,
    createdAt: "2026-06-04",
  },
  {
    id: "ENT-0004",
    player: "Sana Sheikh",
    category: "Community Team League",
    status: "confirmed",
    amountInr: 0,
    createdAt: "2026-06-05",
  },
  {
    id: "ENT-0005",
    player: "Arjun Menon",
    category: "Men's Singles — Open",
    status: "checked_in",
    amountInr: 799,
    createdAt: "2026-06-05",
  },
  {
    id: "ENT-0006",
    player: "Vikram Rao",
    category: "Mixed Doubles — Open",
    status: "waitlisted",
    amountInr: 1199,
    createdAt: "2026-06-06",
  },
  {
    id: "ENT-0007",
    player: "Priya Pillai",
    category: "Men's Singles — Open",
    status: "withdrawn",
    amountInr: 799,
    createdAt: "2026-06-06",
  },
  {
    id: "ENT-0008",
    player: "Kabir Shah",
    category: "Community Team League",
    status: "refunded",
    amountInr: 0,
    createdAt: "2026-06-07",
  },
];

export interface DemoPayment {
  id: string;
  orderId: string;
  player: string;
  status: PaymentStatus;
  amountInr: number;
}

export const demoPayments: DemoPayment[] = [
  { id: "PAY-001", orderId: "order_DEMO0001", player: "Rohan Iyer", status: "paid", amountInr: 799 },
  { id: "PAY-002", orderId: "order_DEMO0002", player: "Meera Nair", status: "created", amountInr: 799 },
  { id: "PAY-003", orderId: "order_DEMO0003", player: "Priya Pillai", status: "refund_pending", amountInr: 799 },
  { id: "PAY-004", orderId: "order_DEMO0004", player: "Dev Kumar", status: "failed", amountInr: 1199 },
];

export const wizardSteps = [
  { id: "basics", label: "Basics" },
  { id: "categories", label: "Categories" },
  { id: "policies", label: "Policies" },
  { id: "branding", label: "Branding" },
  { id: "publish", label: "Publish" },
];
