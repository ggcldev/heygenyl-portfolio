// Homepage: while the hero (and its waves) is behind the header, the header has no bar of
// its own, so the waves run seamlessly up to the top of the screen like on Kudos. Once the
// next section slides up under the header, it turns back into the dark bar.
// (The header height lives in CSS as --site-header-h; the wave canvas uses it to reach up.)

function init(): void {
	const header = document.querySelector<HTMLElement>(".site-header");
	const hero = document.querySelector<HTMLElement>(".home-page .hero-shell");
	if (!header || !hero) return;

	// The section after the hero (skip script/style tags Astro may place in between).
	let next = hero.nextElementSibling as HTMLElement | null;
	while (next && /^(SCRIPT|STYLE|TEMPLATE|LINK)$/.test(next.tagName)) next = next.nextElementSibling as HTMLElement | null;

	let queued = false;
	const update = () => {
		queued = false;
		const headerBottom = header.getBoundingClientRect().bottom;
		const overHero = !next || next.getBoundingClientRect().top > headerBottom;
		header.classList.toggle("is-over-hero", overHero);
	};
	const schedule = () => {
		if (queued) return;
		queued = true;
		requestAnimationFrame(update);
	};
	update();
	window.addEventListener("scroll", schedule, { passive: true });
	window.addEventListener("resize", schedule);
}

init();
