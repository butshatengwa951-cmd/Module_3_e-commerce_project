import router from "../router";

let listenerAttached = false;

export function attachOrderHistoryNavigation() {
  if (listenerAttached) return;
  listenerAttached = true;

  const style = document.createElement("style");
  style.textContent = `
    .history-page .order-card { cursor: pointer; }
    .history-page .order-card::after {
      content: "View delivery →";
      float: right;
      margin-top: 10px;
      color: var(--sw-purple-700);
      font: 800 9px var(--sw-font-body);
      letter-spacing: .04em;
    }
  `;
  document.head.appendChild(style);

  document.addEventListener("click", (event) => {
    const card = event.target.closest(".order-card");
    if (!card || !document.querySelector(".history-page")) return;
    if (event.target.closest("button, a, select, input")) return;

    const number = card.querySelector(".order-number")?.textContent?.match(/#(\d+)/);
    if (!number) return;

    router.push(`/order-history/${number[1]}`);
  });
}
