import type { TimeWindow, Meeting } from "./types";

/** Replace just the painted interval, preserving any precise imported boundaries. */
export function eraseAvailability(windows: TimeWindow[], block: Meeting): TimeWindow[] {
  return windows.flatMap(window => {
    if (window.day !== block.day || window.end <= block.start || window.start >= block.end) {
      return [window];
    }
    return [
      ...(window.start < block.start ? [{ ...window, end: block.start }] : []),
      ...(window.end > block.end ? [{ ...window, start: block.end }] : []),
    ];
  });
}

export function paintAvailability(windows: TimeWindow[], block: TimeWindow): TimeWindow[] {
  const remaining = eraseAvailability(windows, block);
  const sorted = [...remaining, block].sort((a, b) => a.day - b.day || a.start - b.start);
  const merged: TimeWindow[] = [];
  for (const window of sorted) {
    const last = merged[merged.length - 1];
    if (last && last.day === window.day && last.kind === window.kind && last.end >= window.start) {
      last.end = Math.max(last.end, window.end);
    } else {
      merged.push({ ...window });
    }
  }
  return merged;
}
