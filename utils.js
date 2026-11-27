import { canvas } from "./state.js";
import { path } from "./map.js";

export function sx(x) {
  return x * window.innerWidth / 1280;
}

export function sy(y) {
  return y * window.innerHeight / 720;
}

export function scalePoint(point) {
  return { x: sx(point.x), y: sy(point.y) };
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function distanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSq = dx * dx + dy * dy;
  if (!lengthSq) return distance(point, start);
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSq));
  return distance(point, { x: start.x + dx * t, y: start.y + dy * t });
}

export function distanceToPath(point) {
  let nearest = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    nearest = Math.min(nearest, distanceToSegment(point, scalePoint(path[i]), scalePoint(path[i + 1])));
  }
  return nearest;
}

export function canvasPointFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}
