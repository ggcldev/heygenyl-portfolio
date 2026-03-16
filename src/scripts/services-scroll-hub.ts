const initServicesScrollHub = () => {
  const root = document.querySelector<HTMLElement>("[data-services-flow]");
  if (!root) return;

  const cards = Array.from(
    root.querySelectorAll<HTMLElement>("[data-service-card]"),
  );
  const statusItems = Array.from(
    root.querySelectorAll<HTMLElement>("[data-service-status-item]"),
  );
  if (cards.length === 0 || statusItems.length === 0) return;

  const setStatus = (index: number) => {
    statusItems.forEach((item, i) => {
      item.dataset.state = i === index ? "current" : "upcoming";
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const index = cards.indexOf(entry.target as HTMLElement);
        if (index !== -1) setStatus(index);
      }
    },
    { rootMargin: "0px 0px -50% 0px", threshold: 0 },
  );

  cards.forEach((card) => observer.observe(card));

  statusItems.forEach((item) => {
    const index = Number(item.dataset.index ?? "0");
    if (Number.isNaN(index)) return;

    const activate = () => {
      const card = cards[index];
      if (!card) return;
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    item.addEventListener("click", activate);
    item.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      activate();
    });
  });

  setStatus(0);
};

initServicesScrollHub();
