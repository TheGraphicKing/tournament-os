/**
 * Toast — success/error feedback for every mutation (DESIGN_SYSTEM PART 5).
 * Thin wrapper over sonner so call sites stay consistent.
 */
import { toast as sonner } from "sonner";

export const toast = {
  success: (message: string) => sonner.success(message),
  error: (message: string) => sonner.error(message),
  info: (message: string) => sonner.info(message),
  /** For mutations: shows loading, then success/error. */
  promise: <T>(promise: Promise<T>, msgs: { loading: string; success: string; error: string }) =>
    sonner.promise(promise, msgs),
};
