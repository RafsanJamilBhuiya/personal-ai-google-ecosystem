import { requireAdmin } from "./auth-guard.js";

if (location.pathname.endsWith("/login.html")) {
  // Login is the only public application page.
} else {
  await requireAdmin();
}
