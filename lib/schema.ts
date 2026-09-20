import { z } from "zod";

export const DocTypeEnum = z.enum([
  "govt_notice",
  "bank_letter",
  "insurance_letter",
  "other",
]);
export type DocType = z.infer<typeof DocTypeEnum>;

export const UrgencyEnum = z.enum(["high", "medium", "low"]);
export type Urgency = z.infer<typeof UrgencyEnum>;

export const DeadlineTypeEnum = z.enum(["absolute", "relative", "none"]);
export type DeadlineType = z.infer<typeof DeadlineTypeEnum>;

export const DeadlineSchema = z.object({
  type: DeadlineTypeEnum,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().catch(null),
  relative_days: z.number().nullable().catch(null),
  relative_to: z.literal("notice_date").nullable().catch(null),
  quote: z.string().nullable().catch(null),
  // Client-enriched resolved fields (post-processed deterministically in dates.ts)
  resolved_date: z.string().nullable().optional(),
  resolved_error: z.string().nullable().optional(),
});
export type Deadline = z.infer<typeof DeadlineSchema>;

export const ActionItemSchema = z.object({
  task: z.string(),
  deadline: DeadlineSchema,
  why_it_matters: z.string(),
});
export type ActionItem = z.infer<typeof ActionItemSchema>;

export const ContactSchema = z.object({
  label: z.string(),
  value: z.string(),
});
export type Contact = z.infer<typeof ContactSchema>;

export const LanguageEnum = z.enum(["en", "hi", "ta", "bn", "te", "mr", "gu", "kn", "ml"]);
export type SupportedLanguage = z.infer<typeof LanguageEnum>;

export const DocumentAnalysisSchema = z.object({
  doc_type: DocTypeEnum.catch("other"),
  issuer: z.string().nullable().catch(null),
  notice_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().catch(null),
  summary: z.string(),
  urgency: UrgencyEnum.catch("medium"),
  actions: z.array(ActionItemSchema).default([]),
  documents_needed: z.array(z.string()).default([]),
  if_ignored: z.string().nullable().catch(null),
  contacts: z.array(ContactSchema).default([]),
  unclear_points: z.array(z.string()).default([]),
  readable: z.boolean().default(true),
  language: LanguageEnum.default("en"),
});

export type DocumentAnalysis = z.infer<typeof DocumentAnalysisSchema>;

export interface AnalysisApiResponse {
  success: boolean;
  data?: DocumentAnalysis;
  error?: string;
  rawText?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AskApiRequest {
  documentText: string;
  analysisSummary?: string;
  contacts?: Contact[];
  conversation: ChatMessage[];
  question: string;
  language: SupportedLanguage;
}

export interface AskApiResponse {
  success: boolean;
  answer?: string;
  error?: string;
}
