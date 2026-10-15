import "src/ui/obsidian-ui-components/content-container/card-container/card-3d-view/card-3d-view.css";

import { t } from "src/lang/helpers";

export type TableSurface = "honey" | "maple" | "walnut" | "steel" | "slate" | "sage" | "navy";

interface TableSurfaceDefinition {
    kind: "wood" | "metal" | "solid";
    /** Lightest tone of the texture, as #rrggbb */
    light: string;
    /** Darkest tone of the texture, as #rrggbb */
    dark: string;
}

export const TABLE_SURFACES: Record<TableSurface, TableSurfaceDefinition> = {
    honey: { kind: "wood", light: "#d2a670", dark: "#8a5a2c" },
    maple: { kind: "wood", light: "#ead0a6", dark: "#b58750" },
    walnut: { kind: "wood", light: "#7a4d2a", dark: "#2f1c0d" },
    steel: { kind: "metal", light: "#e3e6ea", dark: "#868d97" },
    slate: { kind: "solid", light: "#5d6873", dark: "#48525c" },
    sage: { kind: "solid", light: "#b0bfa6", dark: "#93a589" },
    navy: { kind: "solid", light: "#30425f", dark: "#24324a" },
};

export const DEFAULT_TABLE_SURFACE: TableSurface = "honey";

export function isTableSurface(value: string): value is TableSurface {
    return Object.keys(TABLE_SURFACES).includes(value);
}

/**
 * The table surfaces in display order, with their translated names
 */
export function getTableSurfaceNames(): Record<TableSurface, string> {
    return {
        honey: t("TABLE_SURFACE_HONEY_OAK"),
        maple: t("TABLE_SURFACE_MAPLE"),
        walnut: t("TABLE_SURFACE_WALNUT"),
        steel: t("TABLE_SURFACE_BRUSHED_STEEL"),
        slate: t("TABLE_SURFACE_SLATE"),
        sage: t("TABLE_SURFACE_SAGE"),
        navy: t("TABLE_SURFACE_NAVY"),
    };
}

interface Spring {
    value: number;
    target: number;
    velocity: number;
    stiffness: number;
    damping: number;
}

interface DragState {
    pointerId: number;
    startX: number;
    startY: number;
    startFlip: number;
    /** "pending" until the gesture is clearly a horizontal turn or a vertical scroll */
    mode: "pending" | "turning" | "scrolling";
    lastX: number;
    lastTime: number;
    velocityX: number;
}

/** Pixels a pointer must travel before a press counts as a drag rather than a tap */
const DRAG_THRESHOLD = 8;
/** Degrees of card rotation per pixel dragged */
const DRAG_TURN_RATE = 0.6;
/**
 * Distances in the scene are designed for a card of this width (px) and scaled with the
 * actual card, so the card looks and moves the same in a small window or a maximized one
 */
const REFERENCE_CARD_WIDTH = 400;
/** How far (px, at the reference width) the card rises off the table when picked up */
const LIFT_HEIGHT = 90;
/** How far (deg) the card tilts toward the viewer when picked up */
const LIFT_TILT = 30;
/** Text is never shown smaller than the normal size; long content scrolls instead */
const MIN_TEXT_SCALE = 1;
/** The largest text, as a fraction of the card width. Short questions grow up to this. */
const MAX_FRONT_FONT_SIZE = 1 / 15;
/** The answer side also repeats the question, so it is allowed less growth */
const MAX_BACK_FONT_SIZE = 1 / 19;

/**
 * Shows the current flashcard as an index card lying on a table.
 *
 * The card can be picked up and turned over by dragging it sideways, or flipped with a tap.
 * Turning the card to its back for the first time reports back via `onTurnedToBack`, so the
 * caller can run the regular "show answer" flow. After that the card stays free to turn.
 *
 * Each face has a header band above the card's red line, holding the context and a label
 * naming the side, and a body below it. The caller renders the context into
 * `frontContextEl`/`backContextEl` and the card text into `frontContentEl`/`backContentEl`.
 */
export default class Card3DView {
    public readonly frontContextEl: HTMLDivElement;
    public readonly frontContentEl: HTMLDivElement;
    public readonly backContextEl: HTMLDivElement;
    public readonly backContentEl: HTMLDivElement;

    private sceneEl: HTMLDivElement;
    private tableEl: HTMLDivElement;
    private tabletopEl: HTMLDivElement;
    private shadowEl: HTMLDivElement;
    private cardEl: HTMLDivElement;

    private flip: Spring = Card3DView.createSpring(160, 19);
    private tilt: Spring = Card3DView.createSpring(160, 19);
    private lift: Spring = Card3DView.createSpring(160, 19);
    private slide: Spring = Card3DView.createSpring(120, 20);
    private hoverX: Spring = Card3DView.createSpring(160, 19);
    private hoverY: Spring = Card3DView.createSpring(160, 19);
    private springs: Spring[] = [
        this.flip,
        this.tilt,
        this.lift,
        this.slide,
        this.hoverX,
        this.hoverY,
    ];

    private frameRequest: number | null = null;
    private lastFrameTime = 0;
    private drag: DragState | null = null;
    private hasCard = false;
    private answerShown = false;
    private surface: TableSurface | null = null;
    private onTurnedToBack: () => void;
    private resizeObserver: ResizeObserver;
    private fitTextTimeout: number | null = null;

    private static textureCache = new Map<TableSurface, string>();

    /**
     * @param sideLabels - Text naming each side of the card, e.g. "Question" and "Answer"
     * @param onTurnedToBack - Called the first time the card comes to rest on its back
     */
    constructor(
        parentEl: HTMLElement,
        sideLabels: { front: string; back: string },
        onTurnedToBack: () => void,
    ) {
        this.onTurnedToBack = onTurnedToBack;

        this.sceneEl = parentEl.createDiv("sr-3d-scene");
        this.tableEl = this.sceneEl.createDiv("sr-3d-table");
        this.tabletopEl = this.tableEl.createDiv("sr-3d-tabletop");
        this.tabletopEl.createDiv("sr-3d-tabletop-edge");
        this.shadowEl = this.tableEl.createDiv("sr-3d-card-shadow");
        this.cardEl = this.tableEl.createDiv("sr-3d-card");

        const themeVariables = Card3DView.collectDerivedThemeVariables(parentEl.doc);
        const front = Card3DView.createFace(
            this.cardEl,
            "sr-3d-face-front",
            sideLabels.front,
            themeVariables,
        );
        this.frontContextEl = front.contextEl;
        this.frontContentEl = front.contentEl;
        const back = Card3DView.createFace(
            this.cardEl,
            "sr-3d-face-back",
            sideLabels.back,
            themeVariables,
        );
        this.backContextEl = back.contextEl;
        this.backContentEl = back.contentEl;

        this.cardEl.addEventListener("pointerdown", this.onPointerDown);
        this.cardEl.addEventListener("pointermove", this.onPointerMove);
        this.cardEl.addEventListener("pointerup", this.onPointerUp);
        this.cardEl.addEventListener("pointercancel", this.onPointerUp);
        this.sceneEl.addEventListener("pointermove", this.onScenePointerMove);
        this.sceneEl.addEventListener("pointerleave", this.onScenePointerLeave);

        // Rescale the scene and refit the text when it changes size (window resize, maximize,
        // view shown), and refit when an image inside the card finishes loading
        this.resizeObserver = new ResizeObserver(() => {
            this.updatePerspective();
            this.cardEl.setCssProps({ "--sr-3d-card-unit": this.sceneUnit().toFixed(3) });
            this.fitTextToCard();
            this.render();
        });
        this.resizeObserver.observe(this.sceneEl);
        this.resizeObserver.observe(this.cardEl);
        this.cardEl.addEventListener("load", () => this.fitTextToCard(), true);

        this.render();
    }

    // #region -> public methods

    public setVisible(visible: boolean) {
        this.sceneEl.toggleClass("sr-is-hidden", !visible);
        if (visible) this.kick();
    }

    /**
     * Sizes the text on each face as large as fits without scrolling, so short questions are
     * easy to read. Long content stays at the normal size and scrolls.
     * Call after rendering new content into the faces.
     */
    public fitText() {
        this.fitTextToCard();
        // Some content (maths, embeds) finishes rendering a moment later, so check again
        if (this.fitTextTimeout !== null) this.sceneEl.win.clearTimeout(this.fitTextTimeout);
        this.fitTextTimeout = this.sceneEl.win.setTimeout(() => {
            this.fitTextTimeout = null;
            this.fitTextToCard();
        }, 250);
    }

    /**
     * Sets the table surface. The texture is generated once per surface and cached.
     */
    public setSurface(surface: TableSurface) {
        if (this.surface === surface) return;
        this.surface = surface;
        const definition = TABLE_SURFACES[surface];

        // Flat colours first so the change is instant, then the texture when it is ready
        this.sceneEl.setCssProps({
            "--sr-3d-surface-light": definition.light,
            "--sr-3d-surface-dark": definition.dark,
            "--sr-3d-surface-image": "none",
        });

        const applyTexture = () => {
            if (this.surface !== surface) return;
            let texture = Card3DView.textureCache.get(surface);
            if (texture === undefined) {
                texture = generateSurfaceTexture(definition, this.sceneEl.doc);
                Card3DView.textureCache.set(surface, texture);
            }
            this.sceneEl.setCssProps({ "--sr-3d-surface-image": `url(${texture})` });
        };

        if (Card3DView.textureCache.has(surface)) applyTexture();
        else this.sceneEl.win.setTimeout(applyTexture, 0);
    }

    /**
     * Call before rendering the next card into the faces. The card is reset face up.
     * @param animate - Slide the current card off the table and the new one on
     */
    public beginNextCard(animate: boolean = true) {
        const slideIn = animate && this.hasCard && !this.prefersReducedMotion();
        if (slideIn) this.sendGhostOffTable();

        const width = this.sceneEl.clientWidth || 600;
        this.drag = null;
        this.answerShown = false;
        Card3DView.setSpring(this.flip, 0);
        Card3DView.setSpring(this.tilt, 0);
        Card3DView.setSpring(this.lift, slideIn ? 0.6 : 0);
        Card3DView.setSpring(this.slide, slideIn ? -width * 0.8 : 0);
        this.lift.target = 0;
        this.slide.target = 0;
        this.hasCard = true;

        this.frontContentEl.scrollTop = 0;
        this.backContentEl.scrollTop = 0;
        this.kick();
    }

    /**
     * Turns the card to its back, unless it already shows (or is turning to) its back.
     * Marks the answer as shown so further turning no longer triggers `onTurnedToBack`.
     */
    public turnToBack(animate: boolean = true) {
        this.answerShown = true;
        if (Card3DView.faceOf(this.flip.target) === 1) return;

        const target = this.flip.target + 180;
        if (animate) {
            this.lift.target = 0;
            this.flip.target = target;
        } else {
            Card3DView.setSpring(this.flip, target);
        }
        this.kick();
    }

    /**
     * Turns the card over by half a turn in the given direction, purely visually.
     */
    public turnOver(direction: 1 | -1) {
        this.settleTo(Card3DView.nearestFace(this.flip.target) + 180 * direction);
    }

    public destroy() {
        this.resizeObserver.disconnect();
        if (this.fitTextTimeout !== null) this.sceneEl.win.clearTimeout(this.fitTextTimeout);
        if (this.frameRequest !== null) {
            this.sceneEl.win.cancelAnimationFrame(this.frameRequest);
            this.frameRequest = null;
        }
        this.sceneEl.detach();
    }

    // #region -> text fitting

    private fitTextToCard() {
        const cardWidth = this.cardEl.offsetWidth;
        Card3DView.fitFaceText(this.frontContentEl, cardWidth * MAX_FRONT_FONT_SIZE);
        Card3DView.fitFaceText(this.backContentEl, cardWidth * MAX_BACK_FONT_SIZE);
    }

    /**
     * Finds the largest text scale at which the face's content fits without scrolling,
     * by binary search between the normal size and the given largest font size.
     */
    private static fitFaceText(contentEl: HTMLDivElement, maxFontSize: number) {
        // Hidden faces have no size to fit against; they are refit once they are shown
        if (contentEl.clientHeight === 0 || contentEl.parentElement === null) return;

        const normalFontSize = parseFloat(
            contentEl.win.getComputedStyle(contentEl.parentElement).fontSize,
        );
        if (!(normalFontSize > 0)) return;
        const maxScale = Math.max(MIN_TEXT_SCALE, maxFontSize / normalFontSize);

        // Code blocks and tables scroll sideways on their own, so their overflow does not
        // show up on the face; check them separately so long lines bring the size down too
        const sideScrollers = Array.from(contentEl.querySelectorAll<HTMLElement>("pre, table"));
        const fitsAt = (scale: number): boolean => {
            contentEl.setCssProps({ "--sr-3d-text-scale": String(scale) });
            return (
                contentEl.scrollHeight <= contentEl.clientHeight + 1 &&
                contentEl.scrollWidth <= contentEl.clientWidth + 1 &&
                sideScrollers.every((el) => el.scrollWidth <= el.clientWidth + 1)
            );
        };

        if (fitsAt(maxScale)) return;
        // Too long even at the normal size: leave it there and let it scroll
        if (!fitsAt(MIN_TEXT_SCALE)) return;

        let fits = MIN_TEXT_SCALE;
        let tooBig = maxScale;
        for (let i = 0; i < 6; i++) {
            const middle = (fits + tooBig) / 2;
            if (fitsAt(middle)) fits = middle;
            else tooBig = middle;
        }
        fitsAt(fits);
    }

    // #region -> pointer handling

    private onPointerDown = (e: PointerEvent) => {
        if (!this.hasCard || (e.pointerType === "mouse" && e.button !== 0)) return;
        // Let links, inputs and buttons inside the card work normally
        if ((e.target as HTMLElement).closest("a, button, input, textarea, select")) return;

        this.drag = {
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            startFlip: this.flip.value,
            mode: "pending",
            lastX: e.clientX,
            lastTime: e.timeStamp,
            velocityX: 0,
        };
        this.hoverX.target = 0;
        this.hoverY.target = 0;
    };

    private onPointerMove = (e: PointerEvent) => {
        const drag = this.drag;
        if (drag === null || drag.pointerId !== e.pointerId) return;
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;

        if (drag.mode === "pending") {
            if (Math.abs(dx) > DRAG_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
                drag.mode = "turning";
                this.cardEl.setPointerCapture(e.pointerId);
                this.cardEl.addClass("is-dragging");
                this.lift.target = 1;
            } else if (Math.abs(dy) > DRAG_THRESHOLD) {
                // A vertical gesture scrolls the card's content instead
                drag.mode = "scrolling";
            }
        }
        if (drag.mode !== "turning") return;

        e.preventDefault();
        const elapsed = Math.max(1, e.timeStamp - drag.lastTime);
        drag.velocityX = (e.clientX - drag.lastX) / elapsed;
        drag.lastX = e.clientX;
        drag.lastTime = e.timeStamp;

        Card3DView.setSpring(this.flip, drag.startFlip + dx * DRAG_TURN_RATE);
        this.tilt.target = Math.max(-25, Math.min(25, -dy * 0.2));
        this.kick();
    };

    private onPointerUp = (e: PointerEvent) => {
        const drag = this.drag;
        if (drag === null || drag.pointerId !== e.pointerId) return;
        this.drag = null;
        this.cardEl.removeClass("is-dragging");
        if (this.cardEl.hasPointerCapture(e.pointerId)) {
            this.cardEl.releasePointerCapture(e.pointerId);
        }

        if (drag.mode === "pending" && e.type === "pointerup") {
            // A tap flips the card
            this.settleTo(Card3DView.nearestFace(this.flip.target) + 180);
        } else if (drag.mode === "turning") {
            // Let a flick carry the card further before it settles on a face
            const projected = this.flip.value + drag.velocityX * 160;
            this.settleTo(Card3DView.nearestFace(projected));
        }
    };

    private onScenePointerMove = (e: PointerEvent) => {
        if (this.drag !== null || e.pointerType !== "mouse" || !this.hasCard) return;
        const rect = this.cardEl.getBoundingClientRect();
        if (rect.width === 0) return;
        const x = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
        const y = (e.clientY - (rect.top + rect.height / 2)) / rect.height;
        const over = Math.abs(x) < 0.6 && Math.abs(y) < 0.7;
        this.hoverX.target = over ? x * 8 : 0;
        this.hoverY.target = over ? -y * 6 : 0;
        this.lift.target = over ? 0.12 : 0;
        this.kick();
    };

    private onScenePointerLeave = () => {
        if (this.drag !== null) return;
        this.hoverX.target = 0;
        this.hoverY.target = 0;
        this.lift.target = 0;
        this.kick();
    };

    /**
     * Settles the card flat on the table on the given angle, and reports the first time
     * the card comes to rest showing its back.
     */
    private settleTo(angle: number) {
        this.flip.target = angle;
        this.tilt.target = 0;
        this.lift.target = 0;
        this.kick();

        if (Card3DView.faceOf(angle) === 1 && !this.answerShown) {
            this.answerShown = true;
            this.onTurnedToBack();
        }
    }

    // #region -> animation

    private kick() {
        if (this.frameRequest !== null) return;
        this.lastFrameTime = performance.now();
        this.frameRequest = this.sceneEl.win.requestAnimationFrame(this.tick);
    }

    private tick = (now: number) => {
        const dt = Math.min(0.033, (now - this.lastFrameTime) / 1000);
        this.lastFrameTime = now;
        const reduceMotion = this.prefersReducedMotion();

        let moving = this.drag !== null && this.drag.mode === "turning";
        for (const spring of this.springs) {
            if (reduceMotion) {
                Card3DView.setSpring(spring, spring.target);
                continue;
            }
            spring.velocity +=
                (spring.stiffness * (spring.target - spring.value) -
                    spring.damping * spring.velocity) *
                dt;
            spring.value += spring.velocity * dt;

            const settled =
                Math.abs(spring.target - spring.value) < 0.01 && Math.abs(spring.velocity) < 0.01;
            if (settled) Card3DView.setSpring(spring, spring.target);
            else moving = true;
        }

        this.render();
        this.frameRequest = moving ? this.sceneEl.win.requestAnimationFrame(this.tick) : null;
    };

    private render() {
        this.cardEl.setCssProps({ transform: this.cardTransform() });

        const turn = ((this.flip.value + this.hoverX.value) * Math.PI) / 180;
        const unit = this.sceneUnit();
        const height = this.cardHeightAboveTable();
        const lifted = Math.min(1.4, height / (LIFT_HEIGHT * unit));
        // The shadow narrows as the card stands on its edge and softens as it rises
        const edgeOn = Math.abs(Math.cos(turn));
        this.shadowEl.setCssProps({
            transform:
                "translate(-50%, -50%) translateZ(-1px) " +
                `translateX(${this.slide.value + lifted * 10 * unit}px) ` +
                `translateY(${lifted * 34 * unit}px) ` +
                `scale(${(0.12 + edgeOn * 0.88) * (1 + lifted * 0.1)}, ${1 + lifted * 0.06})`,
            opacity: (0.5 - lifted * 0.28).toFixed(3),
            filter: `blur(${((4 + lifted * 18) * unit).toFixed(1)}px)`,
        });
    }

    /** How much larger the card is than the reference card the scene distances are set for */
    private sceneUnit(): number {
        const width = this.cardEl.offsetWidth;
        return width > 0 ? width / REFERENCE_CARD_WIDTH : 1;
    }

    /**
     * Sets the viewing distance in proportion to the scene, so the 3D effect looks the same
     * whether the review window is small or maximized.
     */
    private updatePerspective() {
        const width = this.sceneEl.clientWidth;
        const height = this.sceneEl.clientHeight;
        if (width === 0 || height === 0) return;
        this.sceneEl.setCssProps({
            perspective: `${Math.round(Math.max(width * 1.5, height * 2))}px`,
        });
    }

    private cardTransform(): string {
        const turn = this.flip.value + this.hoverX.value;
        const tilt = this.tiltDegrees();
        return (
            `translate(-50%, -50%) translateX(${this.slide.value}px) ` +
            `translateZ(${this.cardHeightAboveTable()}px) rotateX(${tilt}deg) rotateY(${turn}deg)`
        );
    }

    private tiltDegrees(): number {
        return -this.lift.value * LIFT_TILT + this.tilt.value + this.hoverY.value;
    }

    /**
     * A card turning around its centre would swing its edges through the table, so it is
     * raised just enough that no corner dips below the surface.
     */
    private cardHeightAboveTable(): number {
        const turn = ((this.flip.value + this.hoverX.value) * Math.PI) / 180;
        const tilt = (this.tiltDegrees() * Math.PI) / 180;
        const clearance =
            (this.cardEl.offsetWidth / 2) * Math.abs(Math.sin(turn)) +
            (this.cardEl.offsetHeight / 2) * Math.abs(Math.sin(tilt)) +
            2;
        return Math.max(this.lift.value * LIFT_HEIGHT * this.sceneUnit(), clearance);
    }

    /**
     * Leaves a copy of the outgoing card that slides off the table, so the real card can
     * show the next question right away.
     */
    private sendGhostOffTable() {
        const ghost = this.cardEl.cloneNode(true) as HTMLDivElement;
        ghost.addClass("sr-3d-card-ghost");
        ghost.removeClass("is-dragging");
        // Keep the copy out of the plugin's cloze lookups, which search the whole document
        ghost
            .querySelectorAll(".cloze-input, .cloze-answer")
            .forEach((el) => el.removeClasses(["cloze-input", "cloze-answer"]));
        ghost.setAttribute("aria-hidden", "true");
        this.tableEl.appendChild(ghost);

        const distance = (this.sceneEl.clientWidth || 600) * 0.9;
        const start = this.cardTransform();
        ghost.setCssProps({ transform: start });
        this.sceneEl.win.requestAnimationFrame(() => {
            ghost.addClass("is-leaving");
            ghost.setCssProps({ transform: `translateX(${distance}px) ${start}` });
        });
        this.sceneEl.win.setTimeout(() => ghost.detach(), 500);
    }

    private prefersReducedMotion(): boolean {
        return this.sceneEl.win.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    /**
     * Collects the theme variables declared on <body> that are built from other variables,
     * e.g. `--callout-info: var(--color-blue)` or `--callout-blend-mode`. Browsers resolve
     * these where they are declared, so on <body> they keep the app theme's values even
     * inside an element that switches to the light theme.
     */
    private static collectDerivedThemeVariables(doc: Document): Record<string, string> {
        const variables: Record<string, string> = {};
        for (const sheet of Array.from(doc.styleSheets)) {
            let rules: CSSRuleList;
            try {
                rules = sheet.cssRules;
            } catch {
                continue; // Stylesheets from other origins cannot be read
            }
            for (const rule of Array.from(rules)) {
                if (!("selectorText" in rule) || (rule as CSSStyleRule).selectorText !== "body") {
                    continue;
                }
                const style = (rule as CSSStyleRule).style;
                for (const name of Array.from(style)) {
                    if (!name.startsWith("--")) continue;
                    const value = style.getPropertyValue(name).trim();
                    // Later rules win, as they do in the cascade
                    if (value.includes("var(")) variables[name] = value;
                }
            }
        }
        return variables;
    }

    private static createFace(
        cardEl: HTMLDivElement,
        sideClass: string,
        sideLabel: string,
        themeVariables: Record<string, string>,
    ): { contextEl: HTMLDivElement; contentEl: HTMLDivElement } {
        // The card is paper whatever the app theme, so everything rendered on it (callouts,
        // code highlighting, tables) uses the light theme's colours. Obsidian and community
        // themes define those colours on the .theme-light class, so it works on any element.
        const faceEl = cardEl.createDiv({ cls: ["sr-3d-face", sideClass, "theme-light"] });
        // Variables derived from those colours are worked out once on <body>, in the app's
        // theme; declaring them again here makes them use the light colours instead
        faceEl.setCssProps(themeVariables);
        const headerEl = faceEl.createDiv("sr-3d-face-header");
        const contextEl = headerEl.createDiv("sr-3d-face-context");
        headerEl.createDiv({ cls: "sr-3d-face-side", text: sideLabel });
        const contentEl = faceEl.createDiv("sr-3d-face-content");
        return { contextEl, contentEl };
    }

    private static createSpring(stiffness: number, damping: number): Spring {
        return { value: 0, target: 0, velocity: 0, stiffness, damping };
    }

    private static setSpring(spring: Spring, value: number) {
        spring.value = value;
        spring.target = value;
        spring.velocity = 0;
    }

    /** The resting angle (a multiple of 180) nearest to the given angle */
    private static nearestFace(angle: number): number {
        return Math.round(angle / 180) * 180;
    }

    /** 0 when the angle rests on the front face, 1 when it rests on the back */
    private static faceOf(angle: number): 0 | 1 {
        return (((Math.round(angle / 180) % 2) + 2) % 2) as 0 | 1;
    }
}

// #region -> surface textures

/**
 * Draws a table surface texture on a canvas and returns it as a data URL.
 * Wood is drawn as planks with growth rings, fibres, knots and seams; metal as long brush
 * strokes; solid colours as a faint matte mottle.
 */
function generateSurfaceTexture(surface: TableSurfaceDefinition, doc: Document): string {
    const width = 960;
    const height = 600;
    const light = hexToRgb(surface.light);
    const dark = hexToRgb(surface.dark);
    const random = seededRandom(1337);
    const noise = createValueNoise(random);

    const canvas = doc.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (context === null) return "";
    const image = context.createImageData(width, height);
    const pixels = image.data;

    const setPixel = (x: number, y: number, darkness: number, shade: number = 1) => {
        const s = Math.min(1, Math.max(0, darkness));
        const i = (y * width + x) * 4;
        pixels[i] = (light[0] + (dark[0] - light[0]) * s) * shade;
        pixels[i + 1] = (light[1] + (dark[1] - light[1]) * s) * shade;
        pixels[i + 2] = (light[2] + (dark[2] - light[2]) * s) * shade;
        pixels[i + 3] = 255;
    };

    if (surface.kind === "wood") {
        drawWood(width, height, random, noise, setPixel);
    } else {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (surface.kind === "metal") {
                    const s =
                        0.45 * noise(x / 420 + 3, y / 0.8) +
                        0.3 * noise(x / 70, y / 0.5 + 50) +
                        0.25 * noise(x / 900, y / 90);
                    setPixel(x, y, 0.15 + s * 0.6);
                } else {
                    const s =
                        0.5 +
                        (noise(x / 1.8, y / 1.8) - 0.5) * 0.45 +
                        (noise(x / 90 + 7, y / 90) - 0.5) * 0.4;
                    setPixel(x, y, s);
                }
            }
        }
    }

    context.putImageData(image, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.88);
}

function drawWood(
    width: number,
    height: number,
    random: () => number,
    noise: (x: number, y: number) => number,
    setPixel: (x: number, y: number, darkness: number, shade?: number) => void,
) {
    const plankCount = 5;
    const plankHeight = height / plankCount;
    const planks = Array.from({ length: plankCount }, () => ({
        offset: random() * 400,
        rings: 4 + random() * 7,
        phase: random() * 10,
        tint: 0.9 + random() * 0.16,
        joint: random() < 0.6 ? 160 + random() * (width - 320) : -1,
        knot:
            random() < 0.65
                ? {
                      x: 70 + random() * (width - 140),
                      y: plankHeight * (0.3 + random() * 0.4),
                      radius: 5 + random() * 8,
                  }
                : null,
    }));

    for (let y = 0; y < height; y++) {
        const plankIndex = Math.min(plankCount - 1, Math.floor(y / plankHeight));
        const plank = planks[plankIndex];
        const localY = y - plankIndex * plankHeight;
        const distanceToSeam = Math.min(localY, plankHeight - 1 - localY);

        for (let x = 0; x < width; x++) {
            // Past a butt joint the board continues as a different piece of wood
            const secondBoard = plank.joint > 0 && x > plank.joint;
            const offset = secondBoard ? plank.offset + 97 : plank.offset;

            let rings =
                (localY / plankHeight) * plank.rings +
                plank.phase +
                noise(x / 260 + offset, localY / 40 + offset) * 2.4 +
                noise(x / 90 + offset, localY / 14) * 0.5;

            let knotDistance = 9;
            if (plank.knot !== null && !secondBoard) {
                const dx = (x - plank.knot.x) / 2.4;
                const dy = localY - plank.knot.y;
                knotDistance = (dx * dx + dy * dy) / (plank.knot.radius * plank.knot.radius);
                rings += 2.4 * Math.exp(-knotDistance * 0.3);
            }

            const ring = 0.5 + 0.5 * Math.sin(rings * Math.PI * 2);
            let darkness =
                0.16 +
                0.44 * ring * ring * ring +
                0.24 * noise(x / 28 + offset * 3, y / 1.1) +
                0.14 * noise(x / 120 + offset, y / 60);
            if (knotDistance < 0.4) darkness += (0.4 - knotDistance) * 2;

            let shade = plank.tint * (secondBoard ? 0.96 : 1);
            if (distanceToSeam < 1.2) shade *= 0.42;
            else if (distanceToSeam < 4) shade *= 0.82 + 0.06 * (distanceToSeam - 1.2);
            if (secondBoard && Math.abs(x - plank.joint) < 1.2) shade *= 0.45;

            setPixel(x, y, darkness, shade);
        }
    }
}

function hexToRgb(hex: string): [number, number, number] {
    const value = hex.replace("#", "");
    return [
        parseInt(value.slice(0, 2), 16),
        parseInt(value.slice(2, 4), 16),
        parseInt(value.slice(4, 6), 16),
    ];
}

/** Park–Miller generator, so every surface looks the same each time it is drawn */
function seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
        state = (state * 16807) % 2147483647;
        return state / 2147483647;
    };
}

/** Smoothly interpolated 2D value noise in the range 0..1 */
function createValueNoise(random: () => number): (x: number, y: number) => number {
    const order = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
    }
    const permutation = new Uint8Array(512);
    for (let i = 0; i < 512; i++) permutation[i] = order[i & 255];
    const values = new Float32Array(256);
    for (let i = 0; i < 256; i++) values[i] = random();

    return (x: number, y: number) => {
        const xi = Math.floor(x);
        const yi = Math.floor(y);
        const xf = x - xi;
        const yf = y - yi;
        const u = xf * xf * (3 - 2 * xf);
        const v = yf * yf * (3 - 2 * yf);
        const row0 = permutation[yi & 255];
        const row1 = permutation[(yi + 1) & 255];
        const a = values[permutation[(xi & 255) + row0]];
        const b = values[permutation[((xi + 1) & 255) + row0]];
        const c = values[permutation[(xi & 255) + row1]];
        const d = values[permutation[((xi + 1) & 255) + row1]];
        const top = a + (b - a) * u;
        const bottom = c + (d - c) * u;
        return top + (bottom - top) * v;
    };
}
