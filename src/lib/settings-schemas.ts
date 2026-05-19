import { z } from "zod";

const nullableStr = (max = 255) =>
  z.preprocess(
    (v) => (v === "" || v == null ? null : String(v).trim()),
    z.string().max(max).nullable(),
  );

const nullableEmail = z.preprocess(
  (v) => (v === "" || v == null ? null : String(v).trim()),
  z.string().email("Email inválido").max(255).nullable(),
);

const nullableUrl = z.preprocess(
  (v) => (v === "" || v == null ? null : String(v).trim()),
  z.string().url("URL inválida").max(255).nullable(),
);

const nullableDay = z.preprocess(
  (v) => (v === "" || v == null ? null : Number(v)),
  z.number().int().min(1).max(31).nullable(),
);

const nullableRate = z.preprocess(
  (v) => (v === "" || v == null ? null : Number(v)),
  z.number().min(0).max(100).nullable(),
);

const nullableCuit = z.preprocess(
  (v) => (v === "" || v == null ? null : String(v).trim()),
  z
    .string()
    .max(20)
    .regex(/^[0-9-]*$/, "Solo números y guiones")
    .nullable(),
);

export const systemParamsSchema = z.object({
  billing_day: nullableDay,
  first_due_day: nullableDay,
  second_due_day: nullableDay,
  interest_rate_after_first: nullableRate,
  interest_rate_after_second: nullableRate,
  cesp_code: nullableStr(50),
});
export type SystemParamsValues = z.infer<typeof systemParamsSchema>;

export const companyInfoSchema = z.object({
  legal_name: nullableStr(255),
  cuit: nullableCuit,
  trade_name: nullableStr(255),
  legal_address: nullableStr(500),
  fiscal_address: nullableStr(500),
  email: nullableEmail,
  phone_main: nullableStr(50),
  phone_mobile: nullableStr(50),
  whatsapp: nullableStr(50),
  website: nullableUrl,
  email_services: nullableEmail,
  email_inquiries: nullableEmail,
  email_collections: nullableEmail,
  iibb: nullableStr(50),
});
export type CompanyInfoValues = z.infer<typeof companyInfoSchema>;

export const platformSettingsSchema = z.object({
  platform_name: nullableStr(120),
  support_email: nullableEmail,
  support_phone: nullableStr(50),
  support_whatsapp: nullableStr(50),
  default_billing_day: nullableDay,
  default_first_due_day: nullableDay,
  default_second_due_day: nullableDay,
  default_interest_after_first: nullableRate,
  default_interest_after_second: nullableRate,
  terms_url: nullableUrl,
  privacy_url: nullableUrl,
});
export type PlatformSettingsValues = z.infer<typeof platformSettingsSchema>;
