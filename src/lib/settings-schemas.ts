import { z } from "zod";

const optStr = (max = 255) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === "" ? null : v ?? null))
    .nullable();

const optEmail = z
  .string()
  .trim()
  .max(255)
  .email("Email inválido")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v && v.length > 0 ? v : null))
  .nullable();

const optUrl = z
  .string()
  .trim()
  .max(255)
  .url("URL inválida")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v && v.length > 0 ? v : null))
  .nullable();

const day = z
  .union([z.coerce.number().int().min(1).max(31), z.literal("").transform(() => null)])
  .nullable()
  .optional()
  .transform((v) => (v === undefined ? null : v));

const rate = z
  .union([z.coerce.number().min(0).max(100), z.literal("").transform(() => null)])
  .nullable()
  .optional()
  .transform((v) => (v === undefined ? null : v));

export const systemParamsSchema = z.object({
  billing_day: day,
  first_due_day: day,
  second_due_day: day,
  interest_rate_after_first: rate,
  interest_rate_after_second: rate,
  cesp_code: optStr(50),
});
export type SystemParamsValues = z.infer<typeof systemParamsSchema>;

export const companyInfoSchema = z.object({
  legal_name: optStr(255),
  cuit: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9-]*$/, "Solo números y guiones")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.length > 0 ? v : null))
    .nullable(),
  trade_name: optStr(255),
  legal_address: optStr(500),
  fiscal_address: optStr(500),
  email: optEmail,
  phone_main: optStr(50),
  phone_mobile: optStr(50),
  whatsapp: optStr(50),
  website: optUrl,
  email_services: optEmail,
  email_inquiries: optEmail,
  email_collections: optEmail,
  iibb: optStr(50),
});
export type CompanyInfoValues = z.infer<typeof companyInfoSchema>;

export const platformSettingsSchema = z.object({
  platform_name: optStr(120),
  support_email: optEmail,
  support_phone: optStr(50),
  support_whatsapp: optStr(50),
  default_billing_day: day,
  default_first_due_day: day,
  default_second_due_day: day,
  default_interest_after_first: rate,
  default_interest_after_second: rate,
  terms_url: optUrl,
  privacy_url: optUrl,
});
export type PlatformSettingsValues = z.infer<typeof platformSettingsSchema>;