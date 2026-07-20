/**
 * Database types for the typed Supabase client.
 * Hand-written to mirror supabase/migrations exactly (same shape as
 * `supabase gen types typescript`). Once a project is linked, regenerate with:
 *   supabase gen types typescript --linked > src/lib/supabase/database.types.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type OrgRole = "owner" | "manager" | "desk";
type TournamentStatus =
  | "draft" | "published" | "reg_open" | "reg_closed" | "live" | "completed" | "archived";
type EntryStatus =
  | "pending_payment" | "confirmed" | "waitlisted" | "pending_partner"
  | "withdrawn" | "refunded" | "checked_in";
type PaymentStatus = "created" | "paid" | "failed" | "refund_pending" | "refunded";
type ClaimStatus = "claimed" | "unclaimed";
type AnnouncementStatus = "pending" | "sent" | "failed";
type JobStatus = "pending" | "done" | "failed";
type RefundPolicy = "full_d7" | "half_d2" | "none";
type CategoryFormat = "knockout" | "league" | "groups";
type CategoryKind = "singles" | "doubles" | "team";
type AnnouncementSegment = "all" | "category" | "unpaid" | "waitlist";
type AnnouncementChannel = "email" | "sms" | "whatsapp";
type SponsorTier = "title" | "gold" | "silver" | "partner";
type CertificateType = "participation" | "winner" | "runner_up" | "semi";
type ReportType = "finance" | "registrations" | "ops" | "sponsor" | "feedback";
type MatchStatus = "scheduled" | "live" | "completed" | "cancelled";

export interface Database {
  public: {
    Tables: {
      organisations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          city: string | null;
          brand_theme: Json | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          city?: string | null;
          brand_theme?: Json | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          city?: string | null;
          brand_theme?: Json | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          name: string | null;
          phone: string | null;
          email: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          phone?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          phone?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      memberships: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          role: OrgRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id: string;
          role: OrgRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string;
          role?: OrgRole;
          created_at?: string;
        };
        Relationships: [];
      };
      tournaments: {
        Row: {
          id: string;
          org_id: string;
          slug: string;
          name: string;
          sport: string;
          status: TournamentStatus;
          venue_name: string | null;
          venue_maps_url: string | null;
          city: string | null;
          start_date: string | null;
          end_date: string | null;
          cover_url: string | null;
          theme: Json | null;
          reg_opens_at: string | null;
          reg_closes_at: string | null;
          refund_policy: RefundPolicy;
          waitlist_enabled: boolean;
          collect_fields: Json | null;
          contact_whatsapp: string | null;
          show_whatsapp: boolean;
          about_md: string | null;
          rules_md: string | null;
          faqs: Json | null;
          created_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          slug: string;
          name: string;
          sport?: string;
          status?: TournamentStatus;
          venue_name?: string | null;
          venue_maps_url?: string | null;
          city?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          cover_url?: string | null;
          theme?: Json | null;
          reg_opens_at?: string | null;
          reg_closes_at?: string | null;
          refund_policy?: RefundPolicy;
          waitlist_enabled?: boolean;
          collect_fields?: Json | null;
          contact_whatsapp?: string | null;
          show_whatsapp?: boolean;
          about_md?: string | null;
          rules_md?: string | null;
          faqs?: Json | null;
          created_at?: string;
          published_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["tournaments"]["Insert"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          tournament_id: string;
          name: string;
          fee_inr: number;
          capacity: number;
          format: CategoryFormat;
          kind: CategoryKind;
          eligibility: Json | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          name: string;
          fee_inr: number;
          capacity: number;
          format: CategoryFormat;
          kind: CategoryKind;
          eligibility?: Json | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          tournament_id: string;
          category_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          category_id: string;
          name: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["teams"]["Insert"]>;
        Relationships: [];
      };
      team_members: {
        Row: {
          team_id: string;
          user_id: string;
          claim_status: ClaimStatus;
          is_payer: boolean;
        };
        Insert: {
          team_id: string;
          user_id: string;
          claim_status?: ClaimStatus;
          is_payer?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["team_members"]["Insert"]>;
        Relationships: [];
      };
      entries: {
        Row: {
          id: string;
          org_id: string;
          tournament_id: string;
          category_id: string;
          status: EntryStatus;
          primary_user_id: string;
          team_id: string | null;
          amount_inr: number;
          collected: Json | null;
          is_multi_entry: boolean;
          offline: boolean;
          note: string | null;
          created_at: string;
          confirmed_at: string | null;
          checked_in_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          tournament_id: string;
          category_id: string;
          status?: EntryStatus;
          primary_user_id: string;
          team_id?: string | null;
          amount_inr: number;
          collected?: Json | null;
          is_multi_entry?: boolean;
          offline?: boolean;
          note?: string | null;
          created_at?: string;
          confirmed_at?: string | null;
          checked_in_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["entries"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          org_id: string;
          entry_id: string;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          amount_inr: number;
          status: PaymentStatus;
          invoice_url: string | null;
          refund_amount_inr: number | null;
          refund_reason: string | null;
          created_at: string;
          paid_at: string | null;
          refunded_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          entry_id: string;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          amount_inr: number;
          status?: PaymentStatus;
          invoice_url?: string | null;
          refund_amount_inr?: number | null;
          refund_reason?: string | null;
          created_at?: string;
          paid_at?: string | null;
          refunded_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          org_id: string;
          tournament_id: string;
          segment: AnnouncementSegment;
          segment_ref: string | null;
          channel: AnnouncementChannel;
          subject: string | null;
          body_md: string;
          status: AnnouncementStatus;
          scheduled_for: string | null;
          sent_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          tournament_id: string;
          segment?: AnnouncementSegment;
          segment_ref?: string | null;
          channel: AnnouncementChannel;
          subject?: string | null;
          body_md: string;
          status?: AnnouncementStatus;
          scheduled_for?: string | null;
          sent_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["announcements"]["Insert"]>;
        Relationships: [];
      };
      scheduled_jobs: {
        Row: {
          id: string;
          org_id: string;
          type: string;
          payload: Json;
          run_after: string;
          status: JobStatus;
          attempts: number;
        };
        Insert: {
          id?: string;
          org_id: string;
          type: string;
          payload?: Json;
          run_after: string;
          status?: JobStatus;
          attempts?: number;
        };
        Update: Partial<Database["public"]["Tables"]["scheduled_jobs"]["Insert"]>;
        Relationships: [];
      };
      sponsors: {
        Row: {
          id: string;
          org_id: string;
          tournament_id: string;
          name: string;
          logo_url: string | null;
          tier: SponsorTier;
          link: string | null;
          placement: Json | null;
          source_url: string | null;
          suggested: boolean;
          approved: boolean;
        };
        Insert: {
          id?: string;
          org_id: string;
          tournament_id: string;
          name: string;
          logo_url?: string | null;
          tier?: SponsorTier;
          link?: string | null;
          placement?: Json | null;
          source_url?: string | null;
          suggested?: boolean;
          approved?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["sponsors"]["Insert"]>;
        Relationships: [];
      };
      results: {
        Row: {
          id: string;
          tournament_id: string;
          category_id: string;
          standings: Json;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          category_id: string;
          standings: Json;
        };
        Update: Partial<Database["public"]["Tables"]["results"]["Insert"]>;
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          tournament_id: string;
          category_id: string;
          home_entry_id: string | null;
          away_entry_id: string | null;
          home_team_id: string | null;
          away_team_id: string | null;
          round: string | null;
          court: string | null;
          scheduled_at: string | null;
          status: MatchStatus;
          score: Json | null;
          live_score: Json | null;
          winner_side: string | null;
          starts_label: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          category_id: string;
          home_entry_id?: string | null;
          away_entry_id?: string | null;
          home_team_id?: string | null;
          away_team_id?: string | null;
          round?: string | null;
          court?: string | null;
          scheduled_at?: string | null;
          status?: MatchStatus;
          score?: Json | null;
          live_score?: Json | null;
          winner_side?: string | null;
          starts_label?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["matches"]["Insert"]>;
        Relationships: [];
      };
      certificates: {
        Row: {
          id: string;
          tournament_id: string;
          user_id: string;
          type: CertificateType;
          pdf_url: string | null;
          issued_at: string | null;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          user_id: string;
          type: CertificateType;
          pdf_url?: string | null;
          issued_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["certificates"]["Insert"]>;
        Relationships: [];
      };
      feedback: {
        Row: {
          id: string;
          tournament_id: string;
          user_id: string;
          nps: number;
          liked: string | null;
          improve: string | null;
          photo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          user_id: string;
          nps: number;
          liked?: string | null;
          improve?: string | null;
          photo_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["feedback"]["Insert"]>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          tournament_id: string;
          type: ReportType;
          pdf_url: string | null;
          data: Json | null;
          generated_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          type: ReportType;
          pdf_url?: string | null;
          data?: Json | null;
          generated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          org_id: string;
          actor_user_id: string | null;
          action: string;
          target: string | null;
          meta: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          actor_user_id?: string | null;
          action: string;
          target?: string | null;
          meta?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_log"]["Insert"]>;
        Relationships: [];
      };
      builder_briefs: {
        Row: {
          id: string;
          edit_token: string;
          brief: Json;
          generation_spec: Json | null;
          outputs: Json;
          status: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          edit_token?: string;
          brief: Json;
          generation_spec?: Json | null;
          outputs?: Json;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["builder_briefs"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      core_entry_list: {
        Row: {
          tournament_id: string;
          category_id: string;
          category_name: string;
          format: CategoryFormat;
          kind: CategoryKind;
          category_sort_order: number;
          entry_id: string;
          status: EntryStatus;
          is_multi_entry: boolean;
          primary_user_id: string;
          player_name: string | null;
          player_phone: string | null;
          team_id: string | null;
          team_name: string | null;
          team_members: Json;
          confirmed_at: string | null;
          checked_in_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      create_organisation: {
        Args: {
          org_name: string;
          org_slug: string;
          org_city?: string | null;
          org_logo_url?: string | null;
        };
        Returns: Database["public"]["Tables"]["organisations"]["Row"];
      };
      builder_create_brief: {
        Args: { p_brief: Json; p_spec: Json };
        Returns: { id: string; edit_token: string }[];
      };
      builder_load_brief: {
        Args: { p_id: string; p_token: string };
        Returns: Database["public"]["Tables"]["builder_briefs"]["Row"];
      };
      builder_save_brief: {
        Args: { p_id: string; p_token: string; p_brief: Json; p_spec: Json };
        Returns: Database["public"]["Tables"]["builder_briefs"]["Row"];
      };
      builder_set_outputs: {
        Args: { p_id: string; p_token: string; p_outputs: Json; p_status?: string };
        Returns: Database["public"]["Tables"]["builder_briefs"]["Row"];
      };
    };
    Enums: {
      org_role: OrgRole;
      tournament_status: TournamentStatus;
      entry_status: EntryStatus;
      payment_status: PaymentStatus;
      claim_status: ClaimStatus;
      announcement_status: AnnouncementStatus;
      job_status: JobStatus;
      refund_policy: RefundPolicy;
      category_format: CategoryFormat;
      category_kind: CategoryKind;
      announcement_segment: AnnouncementSegment;
      announcement_channel: AnnouncementChannel;
      sponsor_tier: SponsorTier;
      certificate_type: CertificateType;
      report_type: ReportType;
      match_status: MatchStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
