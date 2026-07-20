/**
 * Zod schemas for every table — DATA_MODEL.md §2.
 * Validate ALL inputs at the boundary (APP_RULES 8.1). Row schemas mirror
 * the database; Insert schemas are for writes. Money (`amount_inr`) is
 * NEVER accepted from the client — it is server-computed (APP_RULES 2.3),
 * so insert schemas for entries omit it.
 */
import { z } from "zod";
import {
  ANNOUNCEMENT_CHANNELS,
  ANNOUNCEMENT_SEGMENTS,
  ANNOUNCEMENT_STATUSES,
  CATEGORY_FORMATS,
  CATEGORY_KINDS,
  CERTIFICATE_TYPES,
  CLAIM_STATUSES,
  ENTRY_STATUSES,
  JOB_STATUSES,
  PAYMENT_STATUSES,
  REFUND_POLICIES,
  REPORT_TYPES,
  ROLES,
  SPONSOR_TIERS,
  TOURNAMENT_STATUSES,
} from "./enums";

const uuid = z.string().uuid();
const timestamp = z.string(); // ISO timestamptz from Postgres
const slug = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only");
/** Indian mobile in E.164 (+91XXXXXXXXXX). */
export const phoneSchema = z.string().regex(/^\+[1-9]\d{7,14}$/, "Use international format, e.g. +919876543210");
const inr = z.number().int().nonnegative();

export const tournamentStatusSchema = z.enum(TOURNAMENT_STATUSES);
export const entryStatusSchema = z.enum(ENTRY_STATUSES);
export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);
export const claimStatusSchema = z.enum(CLAIM_STATUSES);
export const announcementStatusSchema = z.enum(ANNOUNCEMENT_STATUSES);
export const jobStatusSchema = z.enum(JOB_STATUSES);
export const roleSchema = z.enum(ROLES);
export const refundPolicySchema = z.enum(REFUND_POLICIES);
export const categoryFormatSchema = z.enum(CATEGORY_FORMATS);
export const categoryKindSchema = z.enum(CATEGORY_KINDS);
export const announcementSegmentSchema = z.enum(ANNOUNCEMENT_SEGMENTS);
export const announcementChannelSchema = z.enum(ANNOUNCEMENT_CHANNELS);
export const sponsorTierSchema = z.enum(SPONSOR_TIERS);
export const certificateTypeSchema = z.enum(CERTIFICATE_TYPES);
export const reportTypeSchema = z.enum(REPORT_TYPES);

/* ── Tenancy & roles ───────────────────────────────────────── */

export const organisationSchema = z.object({
  id: uuid,
  name: z.string().min(1),
  slug,
  logo_url: z.string().url().nullable(),
  city: z.string().nullable(),
  brand_theme: z.record(z.string(), z.unknown()).nullable(),
  created_by: uuid.nullable(),
  created_at: timestamp,
});
export const organisationInsertSchema = organisationSchema
  .pick({ name: true, slug: true })
  .extend({ logo_url: z.string().url().optional(), city: z.string().optional() });

/** Onboarding O2 form payload (client → server action). */
export const createOrgSchema = z.object({
  name: z.string().trim().min(2, "Organisation name is too short").max(80),
  city: z.string().trim().max(80).optional(),
  logo_url: z.string().url().optional(),
});
export type CreateOrgInput = z.infer<typeof createOrgSchema>;

/** Onboarding O1 name capture. */
export const profileNameSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
});

export const userSchema = z.object({
  id: uuid,
  name: z.string().nullable(),
  phone: phoneSchema.nullable(),
  email: z.string().email().nullable(),
  avatar_url: z.string().url().nullable(),
  created_at: timestamp,
});
export const userUpdateSchema = userSchema
  .pick({ name: true, phone: true, email: true, avatar_url: true })
  .partial();

export const membershipSchema = z.object({
  id: uuid,
  org_id: uuid,
  user_id: uuid,
  role: roleSchema,
  created_at: timestamp,
});
export const membershipInsertSchema = membershipSchema.pick({
  org_id: true,
  user_id: true,
  role: true,
});

/* ── Tournaments & categories ─────────────────────────────── */

export const faqSchema = z.object({ q: z.string().min(1), a: z.string().min(1) });

/** Organiser theme tokens (DESIGN_SYSTEM PART 4). */
export const eventThemeSchema = z.object({
  accent: z.string(),
  accent_press: z.string(),
  ink: z.string(),
  surface: z.string(),
  on_accent: z.string(),
});

export const tournamentSchema = z.object({
  id: uuid,
  org_id: uuid,
  slug,
  name: z.string().min(1),
  sport: z.string(),
  status: tournamentStatusSchema,
  venue_name: z.string().nullable(),
  venue_maps_url: z.string().url().nullable(),
  city: z.string().nullable(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  cover_url: z.string().url().nullable(),
  theme: eventThemeSchema.nullable(),
  reg_opens_at: timestamp.nullable(),
  reg_closes_at: timestamp.nullable(),
  refund_policy: refundPolicySchema,
  waitlist_enabled: z.boolean(),
  collect_fields: z.record(z.string(), z.unknown()).nullable(),
  contact_whatsapp: z.string().nullable(),
  show_whatsapp: z.boolean(),
  about_md: z.string().nullable(),
  rules_md: z.string().nullable(),
  faqs: z.array(faqSchema).nullable(),
  created_at: timestamp,
  published_at: timestamp.nullable(),
});
export const tournamentInsertSchema = tournamentSchema
  .omit({ id: true, status: true, created_at: true, published_at: true, theme: true })
  .partial()
  .required({ org_id: true, slug: true, name: true });

export const categorySchema = z.object({
  id: uuid,
  tournament_id: uuid,
  name: z.string().min(1),
  fee_inr: inr,
  capacity: z.number().int().positive(),
  format: categoryFormatSchema,
  kind: categoryKindSchema,
  eligibility: z.record(z.string(), z.unknown()).nullable(),
  sort_order: z.number().int(),
  created_at: timestamp,
});
export const categoryInsertSchema = categorySchema.omit({ id: true, created_at: true });

/* ── Entries & teams ──────────────────────────────────────── */

export const entrySchema = z.object({
  id: uuid,
  org_id: uuid,
  tournament_id: uuid,
  category_id: uuid,
  status: entryStatusSchema,
  primary_user_id: uuid,
  team_id: uuid.nullable(),
  amount_inr: inr, // server-computed, never client
  collected: z.record(z.string(), z.unknown()).nullable(),
  is_multi_entry: z.boolean(),
  offline: z.boolean(),
  note: z.string().nullable(),
  created_at: timestamp,
  confirmed_at: timestamp.nullable(),
  checked_in_at: timestamp.nullable(),
});
/** Client registration payload — no status, no amount (server decides both). */
export const entryRegisterSchema = z.object({
  tournament_id: uuid,
  category_id: uuid,
  collected: z.record(z.string(), z.unknown()).optional(),
  partner_phone: phoneSchema.optional(), // doubles: invite partner by phone
  team_name: z.string().min(1).optional(),
});

export const teamSchema = z.object({
  id: uuid,
  tournament_id: uuid,
  category_id: uuid,
  name: z.string().min(1),
  created_at: timestamp,
});
export const teamInsertSchema = teamSchema.omit({ id: true, created_at: true });

export const teamMemberSchema = z.object({
  team_id: uuid,
  user_id: uuid,
  claim_status: claimStatusSchema,
  is_payer: z.boolean(),
});

/* ── Payments ─────────────────────────────────────────────── */

export const paymentSchema = z.object({
  id: uuid,
  org_id: uuid,
  entry_id: uuid,
  razorpay_order_id: z.string().nullable(),
  razorpay_payment_id: z.string().nullable(),
  amount_inr: inr,
  status: paymentStatusSchema,
  invoice_url: z.string().url().nullable(),
  refund_amount_inr: inr.nullable(),
  refund_reason: z.string().nullable(),
  created_at: timestamp,
  paid_at: timestamp.nullable(),
  refunded_at: timestamp.nullable(),
});

/* ── Comms & ops ──────────────────────────────────────────── */

export const announcementSchema = z.object({
  id: uuid,
  org_id: uuid,
  tournament_id: uuid,
  segment: announcementSegmentSchema,
  segment_ref: z.string().nullable(),
  channel: announcementChannelSchema,
  subject: z.string().nullable(),
  body_md: z.string().min(1),
  status: announcementStatusSchema,
  scheduled_for: timestamp.nullable(),
  sent_at: timestamp.nullable(),
});
export const announcementInsertSchema = announcementSchema.omit({
  id: true,
  status: true,
  sent_at: true,
});

export const scheduledJobSchema = z.object({
  id: uuid,
  org_id: uuid,
  type: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
  run_after: timestamp,
  status: jobStatusSchema,
  attempts: z.number().int().nonnegative(),
});

export const sponsorSchema = z.object({
  id: uuid,
  org_id: uuid,
  tournament_id: uuid,
  name: z.string().min(1),
  logo_url: z.string().url().nullable(),
  tier: sponsorTierSchema,
  link: z.string().url().nullable(),
  placement: z.record(z.string(), z.unknown()).nullable(),
  source_url: z.string().url().nullable(),
  suggested: z.boolean(),
  approved: z.boolean(),
});
export const sponsorInsertSchema = sponsorSchema.omit({ id: true });

/* ── Results, certificates, feedback, reports, audit ──────── */

export const resultSchema = z.object({
  id: uuid,
  tournament_id: uuid,
  category_id: uuid,
  standings: z.record(z.string(), z.unknown()), // WRITTEN BY CORE — read-mostly here
});

export const certificateSchema = z.object({
  id: uuid,
  tournament_id: uuid,
  user_id: uuid,
  type: certificateTypeSchema,
  pdf_url: z.string().url().nullable(),
  issued_at: timestamp.nullable(),
});

export const feedbackSchema = z.object({
  id: uuid,
  tournament_id: uuid,
  user_id: uuid,
  nps: z.number().int().min(0).max(10),
  liked: z.string().nullable(),
  improve: z.string().nullable(),
  photo_url: z.string().url().nullable(),
  created_at: timestamp,
});
export const feedbackInsertSchema = feedbackSchema.omit({ id: true, created_at: true });

export const reportSchema = z.object({
  id: uuid,
  tournament_id: uuid,
  type: reportTypeSchema,
  pdf_url: z.string().url().nullable(),
  data: z.record(z.string(), z.unknown()).nullable(),
  generated_at: timestamp,
});

export const auditLogSchema = z.object({
  id: uuid,
  org_id: uuid,
  actor_user_id: uuid.nullable(),
  action: z.string().min(1),
  target: z.string().nullable(),
  meta: z.record(z.string(), z.unknown()).nullable(),
  created_at: timestamp,
});

export type Organisation = z.infer<typeof organisationSchema>;
export type User = z.infer<typeof userSchema>;
export type Membership = z.infer<typeof membershipSchema>;
export type Tournament = z.infer<typeof tournamentSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Entry = z.infer<typeof entrySchema>;
export type Team = z.infer<typeof teamSchema>;
export type TeamMember = z.infer<typeof teamMemberSchema>;
export type Payment = z.infer<typeof paymentSchema>;
export type Announcement = z.infer<typeof announcementSchema>;
export type ScheduledJob = z.infer<typeof scheduledJobSchema>;
export type Sponsor = z.infer<typeof sponsorSchema>;
export type ResultRow = z.infer<typeof resultSchema>;
export type Certificate = z.infer<typeof certificateSchema>;
export type Feedback = z.infer<typeof feedbackSchema>;
export type Report = z.infer<typeof reportSchema>;
export type AuditLog = z.infer<typeof auditLogSchema>;
export type EventTheme = z.infer<typeof eventThemeSchema>;
