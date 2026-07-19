// Single source of truth for the hero globe-chase geometry.
//
// The squirrel runs along the top rim of the globe and the acorns rest on the
// arc just above it. Both the static markup (TopologyRig.astro frontmatter) and
// the scroll animation (motion.ts) derive their coordinates from the same arc
// here, so the no-JS layout is identical to the animated layout at progress 0
// and nothing can drift out of alignment.

export const ARC_CX = 500;
export const ARC_CY = 500;
export const ARC_R = 486; // chase arc: concentric with the globe, GLOBE_R + SQUIRREL_SURFACE_OFFSET
export const GLOBE_R = 460; // globe rim the squirrel's feet track
export const SQUIRREL_SURFACE_OFFSET = ARC_R - GLOBE_R; // 26

export const ARC_START_DEG = -125;
export const ARC_SPAN_DEG = 70;

// Fractions along the arc where each acorn rests, and where the squirrel begins
// its run. The acorns span most of the arc so the scene reads full left to
// right, and the squirrel travels far enough (see squirrelPathTravel in
// motion.ts) to reach the last one on the right side.
export const ACORN_PROGRESS = [0.2, 0.36, 0.52, 0.68, 0.84] as const;
export const SQUIRREL_START = 0.05;

export interface ArcPose {
  x: number;
  y: number;
  rotation: number;
}

// Pose of a point at parameter t (0..1) along the arc, on a circle of radius r.
// rotation is the tangent heading (degrees), matching an object travelling
// along the arc left-to-right.
export function arcPoint(t: number, r: number = ARC_R): ArcPose {
  const angleDeg = ARC_START_DEG + ARC_SPAN_DEG * t;
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: ARC_CX + r * Math.cos(angleRad),
    y: ARC_CY + r * Math.sin(angleRad),
    rotation: angleDeg + 90
  };
}

function round(value: number, places = 2): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

// SVG path `d` for the chase guide, generated from the same constants so the
// visible dashed line and the sampled geometry can never diverge.
export function chaseGuidePath(): string {
  const start = arcPoint(0);
  const end = arcPoint(1);
  return `M${round(start.x)} ${round(start.y)}A${ARC_R} ${ARC_R} 0 0 1 ${round(end.x)} ${round(end.y)}`;
}
