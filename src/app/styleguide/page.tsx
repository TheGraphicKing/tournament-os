"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarDays,
  Home,
  IndianRupee,
  Megaphone,
  Plus,
  Trophy,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { DataTable } from "@/components/app/data-table";
import { Drawer } from "@/components/app/drawer";
import { EmptyState } from "@/components/app/empty-state";
import { FormField } from "@/components/app/form-field";
import { MoneyText } from "@/components/app/money-text";
import { StatCard } from "@/components/app/stat-card";
import { StatusPill } from "@/components/app/status-pill";
import {
  CardSkeleton,
  FormSkeleton,
  StatCardSkeleton,
  TableSkeleton,
} from "@/components/app/skeletons";
import { WizardStepper } from "@/components/app/wizard-stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/lib/toast";
import {
  ENTRY_STATUSES,
  PAYMENT_STATUSES,
  TOURNAMENT_STATUSES,
} from "@/lib/domain/enums";
import { demoEntries, demoPayments, wizardSteps, type DemoEntry } from "./demo-data";

const nav = [
  { href: "/styleguide", label: "Overview", icon: Home },
  { href: "/styleguide#entries", label: "Entries", icon: Users },
  { href: "/styleguide#payments", label: "Payments", icon: IndianRupee },
  { href: "/styleguide#comms", label: "Comms", icon: Megaphone },
  { href: "/styleguide#schedule", label: "Schedule", icon: CalendarDays },
];

const entryColumns: ColumnDef<DemoEntry, unknown>[] = [
  {
    accessorKey: "id",
    header: "Entry",
    cell: ({ row }) => <span className="font-mono text-[0.8125rem]">{row.original.id}</span>,
  },
  { accessorKey: "player", header: "Player" },
  { accessorKey: "category", header: "Category" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusPill status={row.original.status} />,
  },
  {
    accessorKey: "amountInr",
    header: "Fee",
    cell: ({ row }) => <MoneyText amountInr={row.original.amountInr} />,
  },
  {
    accessorKey: "createdAt",
    header: "Registered",
    cell: ({ row }) => <span className="font-mono text-[0.8125rem]">{row.original.createdAt}</span>,
  },
];

export default function StyleguidePage() {
  const [wizardStep, setWizardStep] = useState(2);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [fieldValue, setFieldValue] = useState("");

  return (
    <AppShell
      nav={nav}
      orgs={[{ id: "demo", label: "RizzFitt Sports Club", href: "/styleguide" }]}
      activeOrgId="demo"
      tournaments={[{ id: "open26", label: "Pickleball Open 2026", href: "/styleguide" }]}
      activeTournamentId="open26"
      userName="Asha Owner"
    >
      <div className="space-y-10">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-[1.75rem] font-semibold">Styleguide</h1>
            <p className="text-text-muted">
              Every reusable component, in one place. Same parts render every tournament.
            </p>
          </div>
          {/* One primary action per screen — top-right on desktop */}
          <Button onClick={() => toast.success("Entry created")}>
            <Plus aria-hidden /> New entry
          </Button>
        </header>

        {/* ── Typography ── */}
        <Section title="Typography" subtitle="Clash Display · General Sans · Space Mono — three faces only, every number in mono.">
          <div className="space-y-2 rounded-lg border bg-card p-4">
            <p className="font-display text-[1.75rem] font-semibold">Page title — Clash Display 600</p>
            <p className="font-display text-[1.25rem] font-semibold">Section title — Clash Display 600</p>
            <p className="text-[0.9375rem]">Body — General Sans .9375rem. Clarity over spectacle.</p>
            <p className="text-[0.8125rem] text-text-muted">Label — General Sans .8125rem muted</p>
            <p className="font-mono tabular-nums">
              Mono — 2026-07-18 · ENT-0042 · <MoneyText amountInr={1199} /> · 11–9, 7–11, 11–8
            </p>
          </div>
        </Section>

        {/* ── Status system ── */}
        <Section title="StatusPill" subtitle="The spine of the UI — fixed colour + human label, never colour alone, never an invented status.">
          <div className="space-y-3 rounded-lg border bg-card p-4">
            <PillRow label="Tournament" statuses={TOURNAMENT_STATUSES} />
            <Separator />
            <PillRow label="Entry" statuses={ENTRY_STATUSES} />
            <Separator />
            <PillRow label="Payment" statuses={PAYMENT_STATUSES} />
          </div>
        </Section>

        {/* ── StatCards ── */}
        <Section title="StatCard" subtitle="Big mono number + label + delta. Realtime updates animate the number, not the layout.">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Registrations" value={148} delta={12} hint="last 24h" />
            <StatCard label="Collected" value="₹86,400" delta={8} />
            <StatCard label="Waitlist" value={9} delta={-2} />
            <StatCardSkeleton />
          </div>
        </Section>

        {/* ── DataTable ── */}
        <Section
          id="entries"
          title="DataTable — entries"
          subtitle="Sortable, filterable, paginated, sticky header, CSV export. Empty state below."
        >
          <DataTable
            columns={entryColumns}
            data={demoEntries}
            searchPlaceholder="Search players, categories…"
            csvFileName="entries.csv"
            csvRow={(e) => ({
              entry_id: e.id,
              player: e.player,
              category: e.category,
              status: e.status,
              amount_inr: e.amountInr,
              registered: e.createdAt,
            })}
            pageSize={5}
          />
          <div className="mt-4">
            <DataTable
              columns={entryColumns}
              data={[]}
              emptyTitle="No entries yet — share the registration link to get rolling."
              emptyAction={
                <Button size="sm" onClick={() => toast.info("Link copied")}>
                  Copy registration link
                </Button>
              }
            />
          </div>
        </Section>

        {/* ── Payments row demo ── */}
        <Section id="payments" title="Payment rows" subtitle="Webhook is the source of truth — UI may show “confirming…” until it lands.">
          <div className="divide-y rounded-lg border bg-card">
            {demoPayments.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="font-mono text-[0.8125rem] text-text-muted">{p.orderId}</span>
                <span>{p.player}</span>
                <span className="ml-auto">
                  <MoneyText amountInr={p.amountInr} />
                </span>
                <StatusPill status={p.status} />
              </div>
            ))}
          </div>
        </Section>

        {/* ── Wizard ── */}
        <Section title="WizardStepper" subtitle="Numbered steps, save-on-blur lives in the hosting form — data is never lost.">
          <div className="space-y-4 rounded-lg border bg-card p-4">
            <WizardStepper steps={wizardSteps} current={wizardStep} onStepClick={setWizardStep} />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={wizardStep === 0}
                onClick={() => setWizardStep((s) => s - 1)}
              >
                Back
              </Button>
              <Button
                size="sm"
                disabled={wizardStep === wizardSteps.length - 1}
                onClick={() => setWizardStep((s) => s + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </Section>

        {/* ── Forms ── */}
        <Section title="FormField" subtitle="Label + helper + inline error. Never alert()-style; input is preserved on error.">
          <div className="grid max-w-2xl gap-5 rounded-lg border bg-card p-4 sm:grid-cols-2">
            <FormField label="Tournament name" helper="Shown on the public page." required>
              {(props) => (
                <Input
                  {...props}
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  placeholder="RizzFitt Pickleball Open"
                />
              )}
            </FormField>
            <FormField label="Entry fee (₹)" error="Fee can't be negative.">
              {(props) => <Input {...props} className="font-mono" defaultValue="-100" inputMode="numeric" />}
            </FormField>
            <FormField label="Format">
              {(props) => (
                <Select defaultValue="knockout">
                  <SelectTrigger id={props.id} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="knockout">Knockout</SelectItem>
                    <SelectItem value="league">League</SelectItem>
                    <SelectItem value="groups">Groups</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </FormField>
          </div>
        </Section>

        {/* ── Overlays & feedback ── */}
        <Section id="comms" title="Drawer · ConfirmDialog · Toast" subtitle="Row detail in a drawer; destructive actions confirm with a logged reason; every mutation toasts.">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDrawerOpen(true)}>
              Open entry drawer
            </Button>
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              Withdraw entry
            </Button>
            <Button variant="outline" onClick={() => toast.success("Saved")}>
              Success toast
            </Button>
            <Button variant="outline" onClick={() => toast.error("Payment failed — try again")}>
              Error toast
            </Button>
          </div>

          <Drawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            title="ENT-0001 · Rohan Iyer"
            description="Men's Singles — Open"
          >
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Status</span>
                <StatusPill status="confirmed" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Fee</span>
                <MoneyText amountInr={799} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Order</span>
                <span className="font-mono text-[0.8125rem]">order_DEMO0001</span>
              </div>
            </div>
          </Drawer>

          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Withdraw this entry?"
            description="The player will be notified and the slot is released. This is recorded in the audit log."
            confirmLabel="Withdraw entry"
            requireReason
            onConfirm={(reason) => {
              toast.success(`Entry withdrawn — reason logged: “${reason}”`);
            }}
          />
        </Section>

        {/* ── Empty & loading states ── */}
        <Section id="schedule" title="EmptyState · Skeletons" subtitle="Every list has empty, loading and error states. No layout shift.">
          <div className="grid gap-3 lg:grid-cols-2">
            <EmptyState
              icon={Trophy}
              title="No results yet — they appear here once the core posts finals."
            />
            <div className="space-y-3">
              <TableSkeleton rows={3} />
              <div className="grid grid-cols-2 gap-3">
                <CardSkeleton />
                <FormSkeleton fields={2} />
              </div>
            </div>
          </div>
        </Section>
      </div>
    </AppShell>
  );
}

function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id?: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="font-display text-[1.25rem] font-semibold">{title}</h2>
      <p className="mb-3 text-[0.8125rem] text-text-muted">{subtitle}</p>
      {children}
    </section>
  );
}

function PillRow({
  label,
  statuses,
}: {
  label: string;
  statuses: readonly Parameters<typeof StatusPill>[0]["status"][];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-24 text-[0.8125rem] text-text-muted">{label}</span>
      {statuses.map((s) => (
        <StatusPill key={s} status={s} />
      ))}
    </div>
  );
}
