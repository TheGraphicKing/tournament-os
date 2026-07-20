/**
 * Status enums — mirrors DATA_MODEL.md §3 exactly.
 * The UI never invents a status; every status renders via <StatusPill />.
 */

export const TOURNAMENT_STATUSES = [
  "draft",
  "published",
  "reg_open",
  "reg_closed",
  "live",
  "completed",
  "archived",
] as const;
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];

export const ENTRY_STATUSES = [
  "pending_payment",
  "confirmed",
  "waitlisted",
  "pending_partner",
  "withdrawn",
  "refunded",
  "checked_in",
] as const;
export type EntryStatus = (typeof ENTRY_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "created",
  "paid",
  "failed",
  "refund_pending",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const CLAIM_STATUSES = ["claimed", "unclaimed"] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const ANNOUNCEMENT_STATUSES = ["pending", "sent", "failed"] as const;
export type AnnouncementStatus = (typeof ANNOUNCEMENT_STATUSES)[number];

export const JOB_STATUSES = ["pending", "done", "failed"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const ROLES = ["owner", "manager", "desk"] as const;
export type Role = (typeof ROLES)[number];

export const REFUND_POLICIES = ["full_d7", "half_d2", "none"] as const;
export type RefundPolicy = (typeof REFUND_POLICIES)[number];

export const CATEGORY_FORMATS = ["knockout", "league", "groups"] as const;
export type CategoryFormat = (typeof CATEGORY_FORMATS)[number];

export const CATEGORY_KINDS = ["singles", "doubles", "team"] as const;
export type CategoryKind = (typeof CATEGORY_KINDS)[number];

export const ANNOUNCEMENT_SEGMENTS = ["all", "category", "unpaid", "waitlist"] as const;
export type AnnouncementSegment = (typeof ANNOUNCEMENT_SEGMENTS)[number];

export const ANNOUNCEMENT_CHANNELS = ["email", "sms", "whatsapp"] as const;
export type AnnouncementChannel = (typeof ANNOUNCEMENT_CHANNELS)[number];

export const SPONSOR_TIERS = ["title", "gold", "silver", "partner"] as const;
export type SponsorTier = (typeof SPONSOR_TIERS)[number];

export const CERTIFICATE_TYPES = ["participation", "winner", "runner_up", "semi"] as const;
export type CertificateType = (typeof CERTIFICATE_TYPES)[number];

export const REPORT_TYPES = ["finance", "registrations", "ops", "sponsor", "feedback"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

/** Match status — owned by the live-scoring core (DATA_MODEL §5). */
export const MATCH_STATUSES = ["scheduled", "live", "completed", "cancelled"] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

/** Any status a StatusPill can render. */
export type AnyStatus =
  | TournamentStatus
  | EntryStatus
  | PaymentStatus
  | ClaimStatus
  | AnnouncementStatus
  | JobStatus;

export type StatusTone = "ok" | "warn" | "danger" | "info" | "live" | "neutral";

/**
 * Status → tone + human label (DESIGN_SYSTEM PART 2/6, locked):
 * paid/confirmed = ok · pending/waitlisted = warn ·
 * failed/withdrawn/refunded = danger · informational = info · live = live.
 * Never show a raw enum; always the human label.
 */
export const STATUS_META: Record<AnyStatus, { label: string; tone: StatusTone }> = {
  // tournament
  draft: { label: "Draft", tone: "neutral" },
  published: { label: "Published", tone: "info" },
  reg_open: { label: "Registration open", tone: "ok" },
  reg_closed: { label: "Registration closed", tone: "warn" },
  live: { label: "Live", tone: "live" },
  completed: { label: "Completed", tone: "info" },
  archived: { label: "Archived", tone: "neutral" },
  // entry
  pending_payment: { label: "Pending payment", tone: "warn" },
  confirmed: { label: "Confirmed", tone: "ok" },
  waitlisted: { label: "Waitlisted", tone: "warn" },
  pending_partner: { label: "Pending partner", tone: "warn" },
  withdrawn: { label: "Withdrawn", tone: "danger" },
  refunded: { label: "Refunded", tone: "danger" },
  checked_in: { label: "Checked in", tone: "ok" },
  // payment
  created: { label: "Created", tone: "warn" },
  paid: { label: "Paid", tone: "ok" },
  failed: { label: "Failed", tone: "danger" },
  refund_pending: { label: "Refund pending", tone: "warn" },
  // team_members.claim_status
  claimed: { label: "Claimed", tone: "ok" },
  unclaimed: { label: "Unclaimed", tone: "warn" },
  // announcement / job
  pending: { label: "Pending", tone: "warn" },
  sent: { label: "Sent", tone: "ok" },
  done: { label: "Done", tone: "ok" },
};
