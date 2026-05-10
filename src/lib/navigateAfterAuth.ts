import type { Router } from "expo-router";

/**
 * After login/register, AuthContext updates are scheduled async. If we
 * `router.replace` into `(app)` immediately, `(app)/_layout` can render once
 * with the old context (still logged out) and redirect back to /login.
 * Defer navigation until after React applies the new auth state.
 */
export function navigateToAppHome(router: Router): void {
  setTimeout(() => {
    router.replace("/(app)/(tabs)/home");
  }, 0);
}
