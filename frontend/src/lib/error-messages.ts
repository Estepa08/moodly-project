import type { TFunction } from "i18next";
import { ApiError } from "./api-error";

const ERROR_CODE_MAP: Record<string, string> = {
  NOT_FOUND: "errors.notFound",
  UNAUTHORIZED: "errors.unauthorized",
  INVALID_CREDENTIALS: "errors.invalidCredentials",
  EMAIL_NOT_VERIFIED: "auth.emailNotVerified",
  CONFLICT: "errors.conflict",
  CONSENT_REQUIRED: "errors.consentRequired",
  INVALID_REFRESH_TOKEN: "errors.sessionExpired",
  REFRESH_TOKEN_EXPIRED: "errors.sessionExpired",
  INVALID_RESET_TOKEN: "errors.invalidResetToken",
  RESET_TOKEN_EXPIRED: "errors.invalidResetToken",
  ALREADY_CHECKED_IN: "errors.alreadyCheckedIn",
  DAILY_LIMIT: "errors.dailyLimit",
  VALIDATION_ERROR: "errors.validationError",
  INTERNAL: "common.somethingWentWrong",
};

export function getErrorMessage(error: unknown, t: TFunction): string {
  if (error instanceof ApiError) {
    const key = ERROR_CODE_MAP[error.code];
    if (key) return t(key);
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return t("common.somethingWentWrong");
}
