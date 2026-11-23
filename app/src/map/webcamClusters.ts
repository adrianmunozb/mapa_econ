import type { Webcam } from '../data/webcams';

// 52px badges retain 20px of breathing room. Fixed anchors avoid cell-edge overlap.
export const CAMERA_SEPARATION = 72;
export const CAMERA_MARGIN = 28;
export interface CameraGroup {
  id: string;
  cameras: Webcam[];
  center: [number, number];
  x: number;
  y: number;
}

/** Linear pass with a spatial hash; only visible cameras get DOM markers. */
export function clusterWebcams(
  cameras: readonly Webcam[],
  project: (coordinates: [number, number]) => { x: number; y: number },
  width: number,
  height: number,
): CameraGroup[] {
  const groups: CameraGroup[] = [];
  const columns = Math.ceil((width + 2 * CAMERA_MARGIN) / CAMERA_SEPARATION) + 3;
  const rows = Math.ceil((height + 2 * CAMERA_MARGIN) / CAMERA_SEPARATION) + 3;
  const cells: (CameraGroup[] | undefined)[] = new Array(columns * rows);
  for (const camera of cameras) {
    const { x, y } = project(camera.coordinates);
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < -CAMERA_MARGIN || y < -CAMERA_MARGIN || x > width + CAMERA_MARGIN || y > height + CAMERA_MARGIN) continue;
    const col = Math.floor((x + CAMERA_MARGIN) / CAMERA_SEPARATION) + 1;
    const row = Math.floor((y + CAMERA_MARGIN) / CAMERA_SEPARATION) + 1;
    let nearest: CameraGroup | undefined;
    let distance = CAMERA_SEPARATION ** 2;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const cell = cells[(row + dy) * columns + col + dx];
        if (!cell) continue;
        for (const group of cell) {
          const candidate = (x - group.x) ** 2 + (y - group.y) ** 2;
          if (candidate < distance) { nearest = group; distance = candidate; }
        }
      }
    }
    if (nearest) { nearest.cameras.push(camera); continue; }
    const group: CameraGroup = { id: camera.id, cameras: [camera], center: camera.coordinates, x, y };
    groups.push(group);
    const key = row * columns + col;
    const cell = cells[key];
    if (cell) cell.push(group);
    else cells[key] = [group];
  }
  return groups;
}
