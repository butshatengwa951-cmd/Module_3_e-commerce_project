import router from "../router";

let listenerAttached = false;

export function attachOrderHistoryNavigation() {
  if (listenerAttached) return;
  listenerAttached = true;

  document.addEventListener("click", (event) => {
    const card = event.target.closest(".order-card");
    if (!card || !document.querySelector(".history-page")) return;
    if (event.target.closest("button, a, select, input")) return;

    const number = card.querySelector(".order-number")?.textContent?.match(/#(\d+)/);
    if (!number) return;

    router.push(`/order-history/${number[1]}`);
  });
}
