const KEY = "lovable.actingTenantId";
const NAME_KEY = "lovable.actingTenantName";

export function getActingTenantId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function getActingTenantName(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(NAME_KEY);
  } catch {
    return null;
  }
}

export function setActingTenant(id: string, name?: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, id);
    if (name) window.localStorage.setItem(NAME_KEY, name);
  } catch {
    // ignore
  }
}

export function clearActingTenant() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(NAME_KEY);
  } catch {
    // ignore
  }
}