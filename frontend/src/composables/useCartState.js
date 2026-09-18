const CART_STORAGE_KEY = "stockwellCartState";
const CHECKOUT_STORAGE_KEY = "stockwellCheckoutState";
const LEGACY_COUNT_KEY = "basketCount";

function safeParse(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function readCartState() {
  const stored = safeParse(localStorage.getItem(CART_STORAGE_KEY), null);
  if (stored && Array.isArray(stored.items)) {
    return {
      ...stored,
      itemCount: stored.items.length,
    };
  }

  return {
    itemCount: 0,
    total: 0,
    order: null,
    items: [],
    stokvel: null,
  };
}

export function saveCartState({ items = [], order = null, stokvel = null } = {}) {
  const normalizedItems = Array.isArray(items) ? items : [];
  // The cart badge counts item lines, not individual units.
  // Example: 10 bags of Huletts Sugar = 1 cart item.
  const itemCount = normalizedItems.length;
  const total = normalizedItems.reduce(
    (sum, item) => sum + Number(item.subtotal || 0),
    0,
  );

  const state = {
    itemCount,
    total: Number(total.toFixed(2)),
    order: order || null,
    items: normalizedItems,
    stokvel: stokvel || null,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  localStorage.setItem(LEGACY_COUNT_KEY, String(itemCount));
  window.dispatchEvent(new CustomEvent("cart-state-updated", { detail: state }));
  window.dispatchEvent(new CustomEvent("basket-updated", { detail: itemCount }));
  window.dispatchEvent(new CustomEvent("cart-change", { detail: itemCount }));

  return state;
}

export function saveCheckoutState({ order = null, items = [], stokvel = null } = {}) {
  const state = {
    order,
    items: Array.isArray(items) ? items : [],
    stokvel: stokvel || null,
    savedAt: new Date().toISOString(),
  };

  localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function readCheckoutState() {
  return safeParse(localStorage.getItem(CHECKOUT_STORAGE_KEY), null);
}

export function clearCartState() {
  localStorage.removeItem(CART_STORAGE_KEY);
  localStorage.removeItem(LEGACY_COUNT_KEY);
  window.dispatchEvent(
    new CustomEvent("cart-state-updated", {
      detail: { itemCount: 0, total: 0, order: null, items: [], stokvel: null },
    }),
  );
  window.dispatchEvent(new CustomEvent("basket-updated", { detail: 0 }));
  window.dispatchEvent(new CustomEvent("cart-change", { detail: 0 }));
}

export function clearCheckoutState() {
  localStorage.removeItem(CHECKOUT_STORAGE_KEY);
}

export { CART_STORAGE_KEY, CHECKOUT_STORAGE_KEY, LEGACY_COUNT_KEY };
