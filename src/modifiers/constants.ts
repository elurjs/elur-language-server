/**
 * constants.ts — Event modifiers, key modifiers, events, directives.
 *
 * Ported from elur-vscode/event-modifiers.js and extension.js.
 * Single source of truth for all Elur template tooling.
 */

export const EVENT_MODIFIERS = [
  "prevent", "stop", "self", "once", "capture", "passive",
] as const;

export const KEY_MODIFIERS = [
  "enter", "escape", "space", "tab",
  "delete", "backspace",
  "up", "down", "left", "right",
] as const;

export const KEY_EVENTS = ["keydown", "keyup", "keypress"] as const;

export const KNOWN_MODIFIERS = new Set<string>([
  ...EVENT_MODIFIERS,
  ...KEY_MODIFIERS,
]);

export const EVENT_BINDINGS = [
  "click", "input", "change", "submit",
  "keydown", "keyup", "focus", "blur",
  "mouseenter", "mouseleave",
  "mousedown", "mouseup",
  "touchstart", "touchend",
  "dblclick", "contextmenu",
  "keypress", "scroll", "wheel",
  "drag", "dragstart", "dragend", "dragover", "dragenter", "dragleave", "drop",
  "touchmove", "touchcancel",
  "pointerdown", "pointerup", "pointermove",
  "animationstart", "animationend", "animationiteration",
  "transitionstart", "transitionend",
  "load", "error",
  "copy", "cut", "paste",
] as const;

export const DIRECTIVE_ATTRIBUTES = ["ref", "show", "hide"] as const;

export const TEMPLATE_TAGS = ["html", "raw"] as const;

export const MODIFIER_HELP: Readonly<Record<string, string>> = {
  prevent: "Calls event.preventDefault()",
  stop: "Calls event.stopPropagation()",
  self: "Runs only when event.target === currentTarget",
  once: "Listener is removed after first call",
  capture: "Registers listener with capture: true",
  passive: "Registers listener with passive: true",
  enter: "Only runs when key is Enter",
  escape: "Only runs when key is Escape",
  space: "Only runs when key is Space",
  tab: "Only runs when key is Tab",
  delete: "Only runs when key is Delete",
  backspace: "Only runs when key is Backspace",
  up: "Only runs when key is ArrowUp",
  down: "Only runs when key is ArrowDown",
  left: "Only runs when key is ArrowLeft",
  right: "Only runs when key is ArrowRight",
};

export const EVENT_MODIFIER_ORDER: Record<string, number> = Object.fromEntries(
  EVENT_MODIFIERS.map((m, i) => [m, i]),
);

export const KEY_MODIFIER_ORDER: Record<string, number> = Object.fromEntries(
  KEY_MODIFIERS.map((m, i) => [m, i]),
);
