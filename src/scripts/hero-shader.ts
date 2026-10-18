// Homepage hero background: slow rolling waves of very dark greys, matched to the look of
// the Kudos hero (same size, speed and tones), written from scratch here (owner asked for
// the Kudos look without copying their code). A turbulence field is read as a wave and
// mapped onto five dark grey tones. Kept cheap on purpose:
// - drawn at about a third of the screen resolution, then stretched (soft light needs no sharp pixels);
// - capped at 30 frames a second;
// - paused while the hero is covered by the next sections or the tab is hidden;
// - started only after the page has loaded and the browser is idle;
// - a single still frame for reduced motion or data saver; nothing at all without WebGL.
// The site's existing grain overlay (body::after) sits on top, like Kudos.

const RENDER_SCALE = 0.34;
const RENDER_SCALE_SMALL = 0.3;
const FRAME_MS = 1000 / 30;
/** Frames checked after start; if over a third arrive later than SLOW_FRAME_MS, animation stops. */
const PROBE_FRAMES = 45;
const SLOW_FRAME_MS = 70;
const TIME_WRAP_S = 3600;

// Look settings, matched to the Kudos hero by eye and by sampling its pixels.
const LOOK = {
	zoom: 0.4, // bigger number = smaller waves
	bend: 0.4, // how far the turbulence pushes the waves around
	bendFreq: 0.4,
	waveFreq: 2.0,
	speed: 0.3,
	angle: 1.1, // overall direction of the waves (radians)
	exposure: 1.1,
	contrast: 1.1,
	/** Five dark greys (sRGB 0..1), deliberately not in order so the field reads as rolling waves. */
	tones: [0.02, 0.059, 0.039, 0.102, 0.078],
};

// Brand-colour rim on the wave edges (owner: colour only slips in where a wave heads out
// toward the edge, not all over).
const EDGE = {
	level: 0.66, // which part of the wave gets the rim (rising into the light crest)
	width: 0.12, // rim thickness, in wave units
	fadeStart: 0.25, // no colour this close to the headline area
	fadeEnd: 0.75, // full colour from here out to the screen edges
	strength: 0.2,
};

/** Perceptual lightness (OKLab L) of an sRGB grey, so tones blend evenly to the eye. */
const lightness = (srgb: number) => Math.cbrt(srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4);
const toneLightness = LOOK.tones.map((tone) => lightness(tone).toFixed(5));
const glslFloat = (n: number) => n.toFixed(4);

const VERTEX = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_mouse; // xy in the same space as p, z = strength 0..1

float hash(vec2 q) { return fract(sin(dot(q, vec2(12.9898, 78.233))) * 43758.5453); }

float toSrgb(float c) { return c <= 0.0031308 ? c * 12.92 : 1.055 * pow(c, 1.0 / 2.4) - 0.055; }

// Brand spectrum, 0..1: seafoam green (#43d39e) → teal → soft blue → violet.
vec3 brand(float h) {
	vec3 green = vec3(0.263, 0.827, 0.620);
	vec3 teal = vec3(0.184, 0.780, 0.790);
	vec3 blue = vec3(0.357, 0.549, 1.0);
	vec3 violet = vec3(0.561, 0.482, 1.0);
	float x = clamp(h, 0.0, 1.0) * 3.0;
	return x < 1.0 ? mix(green, teal, x) : x < 2.0 ? mix(teal, blue, x - 1.0) : mix(blue, violet, x - 2.0);
}

// Wave value 0..1 to a grey: blend the five tones by perceived lightness, then a little
// exposure and contrast.
float shade(float v) {
	float x = clamp(v, 0.0, 1.0) * 4.0;
	float l = x < 1.0 ? mix(${toneLightness[0]}, ${toneLightness[1]}, x)
		: x < 2.0 ? mix(${toneLightness[1]}, ${toneLightness[2]}, x - 1.0)
		: x < 3.0 ? mix(${toneLightness[2]}, ${toneLightness[3]}, x - 2.0)
		: mix(${toneLightness[3]}, ${toneLightness[4]}, x - 3.0);
	float linear = l * l * l * ${glslFloat(LOOK.exposure)};
	l = clamp((pow(linear, 1.0 / 3.0) - 0.5) * ${glslFloat(LOOK.contrast)} + 0.5, 0.0, 1.0);
	return toSrgb(l * l * l);
}

void main() {
	vec2 p = (gl_FragCoord.xy * 2.0 - u_res) / u_res.y;

	// Cursor: nudge the waves away from the pointer (before turning, so it lines up).
	vec2 d = p - u_mouse.xy;
	p += d * exp(-dot(d, d) * 3.0) * 0.25 * u_mouse.z;
	p = mat2(cos(${glslFloat(LOOK.angle)}), -sin(${glslFloat(LOOK.angle)}), sin(${glslFloat(LOOK.angle)}), cos(${glslFloat(LOOK.angle)})) * p;

	// Turbulence: the point is pushed around by sines whose phases (a, b) keep drifting.
	float t = u_time * ${glslFloat(LOOK.speed)};
	vec2 q = p * ${glslFloat(LOOK.zoom)};
	float a = 1.9;
	float b = -0.7;
	for (int j = 2; j < 9; j++) {
		float fj = float(j);
		q += ${glslFloat(LOOK.bend)} * sin(q.yx * ${glslFloat(LOOK.bendFreq)} * fj + t + vec2(a, b) + vec2(0.43, 0.21) * fj) / fj;
		a += cos(fj + b * 1.2 + q.x * 2.0 - t + 0.6);
		b += sin(fj * q.y + a + t + 1.3);
	}

	// Read it as a wave, softened by averaging three phase-shifted copies (weights 1:2:1).
	float w = length(q.yx + vec2(a, b) * 0.2) * ${glslFloat(LOOK.waveFreq)} + 0.4;
	float v = (0.5 * sin(w + 1.0) + sin(w + 4.0) + 0.5 * sin(w + 9.0)) * 0.25 + 0.5;
	v = clamp((v - 0.3) / 0.4, 0.0, 1.0);

	vec3 col = vec3(shade(v));

	// Brand spectrum on the wave edges only: a thin rim where each wave rises into its light
	// crest, fading in toward the screen edges and staying out from behind the headline.
	vec2 uv = gl_FragCoord.xy / u_res;
	float aspect = u_res.x / u_res.y;
	float rim = exp(-pow((v - ${glslFloat(EDGE.level)}) / ${glslFloat(EDGE.width)}, 2.0));
	float away = length((uv - vec2(0.32, 0.55)) * vec2(aspect / 1.6, 1.0));
	float toEdge = smoothstep(${glslFloat(EDGE.fadeStart)}, ${glslFloat(EDGE.fadeEnd)}, away);
	col += brand(0.35 + 0.35 * sin(q.x * 0.9 + q.y * 0.6 + t * 0.4)) * rim * toEdge * ${glslFloat(EDGE.strength)};

	col += (hash(gl_FragCoord.xy) - 0.5) / 255.0; // break up colour banding
	gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
	const shader = gl.createShader(type);
	if (!shader) return null;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}

function isSoftwareRenderer(gl: WebGLRenderingContext): boolean {
	const info = gl.getExtension("WEBGL_debug_renderer_info");
	const renderer = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
	return /swiftshader|llvmpipe|softpipe|software|basic render|mesa offscreen/i.test(renderer);
}

/**
 * Checks for a real graphics chip on a throwaway canvas, then closes it, so the hero
 * canvas never holds a slow software context (which would still cost time to composite).
 */
function hasHardwareWebGL(): boolean {
	const probe = document.createElement("canvas").getContext("webgl", { failIfMajorPerformanceCaveat: true });
	if (!probe) return false;
	const ok = !isSoftwareRenderer(probe);
	probe.getExtension("WEBGL_lose_context")?.loseContext();
	return ok;
}

function start(canvas: HTMLCanvasElement, hero: HTMLElement): void {
	// No real graphics chip (software WebGL draws on the CPU and blocks the page): skip it
	// entirely and keep the plain dark hero.
	// Dev only: ?shader=force runs it anyway (for testing in browsers without a graphics chip).
	const forced = import.meta.env.DEV && new URLSearchParams(location.search).get("shader") === "force";
	if (!forced && !hasHardwareWebGL()) return;
	const gl = canvas.getContext("webgl", {
		alpha: false,
		antialias: false,
		depth: false,
		stencil: false,
		powerPreference: "low-power",
		preserveDrawingBuffer: false,
		failIfMajorPerformanceCaveat: !forced,
	});
	if (!gl || (!forced && isSoftwareRenderer(gl))) return;

	const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
	const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
	const program = gl.createProgram();
	if (!vs || !fs || !program) return;
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
	gl.useProgram(program);

	// One triangle that covers the whole screen.
	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
	const aPos = gl.getAttribLocation(program, "a_pos");
	gl.enableVertexAttribArray(aPos);
	gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

	const uRes = gl.getUniformLocation(program, "u_res");
	const uTime = gl.getUniformLocation(program, "u_time");
	const uMouse = gl.getUniformLocation(program, "u_mouse");

	const still =
		window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
		Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
	const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
	// The section after the hero (skip script/style tags Astro may place in between).
	let next = hero.nextElementSibling as HTMLElement | null;
	while (next && /^(SCRIPT|STYLE|TEMPLATE|LINK)$/.test(next.tagName)) next = next.nextElementSibling as HTMLElement | null;

	let width = 0;
	let height = 0;
	const resize = () => {
		const rect = canvas.getBoundingClientRect();
		const scale = rect.width < 768 ? RENDER_SCALE_SMALL : RENDER_SCALE;
		const w = Math.max(1, Math.round(rect.width * scale));
		const h = Math.max(1, Math.round(rect.height * scale));
		if (w === width && h === height) return;
		width = w;
		height = h;
		canvas.width = w;
		canvas.height = h;
		gl.viewport(0, 0, w, h);
		gl.uniform2f(uRes, w, h);
	};

	// Pointer, eased so the smoke drifts after it rather than snapping.
	const mouse = { x: 0, y: 0, tx: 0, ty: 0, strength: 0, target: 0 };
	const toShaderSpace = (clientX: number, clientY: number) => {
		const rect = canvas.getBoundingClientRect();
		const aspect = rect.width / rect.height;
		const u = (clientX - rect.left) / rect.width;
		const v = 1 - (clientY - rect.top) / rect.height;
		// Same space as the shader's p: x from -aspect to aspect, y from -1 to 1.
		return [(u * 2 - 1) * aspect, v * 2 - 1] as const;
	};
	if (finePointer && !still) {
		window.addEventListener(
			"pointermove",
			(event) => {
				[mouse.tx, mouse.ty] = toShaderSpace(event.clientX, event.clientY);
				mouse.target = 1;
			},
			{ passive: true },
		);
		document.documentElement.addEventListener("pointerleave", () => (mouse.target = 0), { passive: true });
	}

	const draw = (seconds: number) => {
		mouse.x += (mouse.tx - mouse.x) * 0.06;
		mouse.y += (mouse.ty - mouse.y) * 0.06;
		mouse.strength += (mouse.target - mouse.strength) * 0.04;
		gl.uniform1f(uTime, seconds % TIME_WRAP_S);
		gl.uniform3f(uMouse, mouse.x, mouse.y, mouse.strength);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	};

	resize();
	draw(12); // a pleasant first frame, also the still frame
	canvas.classList.add("is-ready");
	window.addEventListener("resize", () => {
		resize();
		if (still) draw(12);
	});
	if (still) return;

	// The hero is sticky, so it stays "on screen" under the later sections: it only shows
	// while the next section's top is still below the top of the viewport.
	const heroShowing = () => !document.hidden && (!next || next.getBoundingClientRect().top > 0);

	let running = false;
	let stopped = false;
	let last = 0;
	let elapsed = 12;
	// Struggling devices: if our frames come in far slower than asked for (slow gaps between
	// frames in the first couple of seconds), stop and keep the still image.
	let probeFrames = 0;
	let probeSlow = 0;
	const frame = (now: number) => {
		if (stopped || !heroShowing()) {
			running = false;
			return;
		}
		requestAnimationFrame(frame);
		const delta = now - last;
		if (delta < FRAME_MS - 2) return;
		if (probeFrames < PROBE_FRAMES) {
			probeFrames += 1;
			if (delta > SLOW_FRAME_MS) probeSlow += 1;
			if (probeFrames === PROBE_FRAMES && probeSlow > PROBE_FRAMES / 3) stopped = true;
		}
		elapsed += Math.min(delta, 100) / 1000;
		last = now;
		draw(elapsed);
	};
	const wake = () => {
		if (stopped || running || !heroShowing()) return;
		running = true;
		last = performance.now();
		requestAnimationFrame(frame);
	};
	window.addEventListener("scroll", wake, { passive: true });
	document.addEventListener("visibilitychange", wake);
	// If the graphics chip drops the context (rare), just fall back to the plain dark hero.
	canvas.addEventListener("webglcontextlost", () => canvas.classList.remove("is-ready"));
	wake();
}

function init(): void {
	const canvas = document.querySelector<HTMLCanvasElement>("canvas.hero-shader");
	const hero = canvas?.closest<HTMLElement>(".hero-shell");
	if (!canvas || !hero) return;
	const go = () => start(canvas, hero);
	const idle = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
	const later = () => (idle ? idle(go, { timeout: 1500 }) : window.setTimeout(go, 300));
	if (document.readyState === "complete") later();
	else window.addEventListener("load", later, { once: true });
}

init();
