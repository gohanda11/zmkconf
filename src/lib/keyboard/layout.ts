import type { LayoutKey } from './types';

// Left half: cols 0-26 (27 HE keys), col 27 = encoder button
export const LEFT_HE_COLS = Array.from({ length: 27 }, (_, i) => i);
// Right half: cols 28-51 (24 HE keys), col 52 = encoder button
export const RIGHT_HE_COLS = Array.from({ length: 24 }, (_, i) => i + 28);

export function globalColToLocalIndex(col: number): { half: 'left' | 'right'; index: number } | null {
  const leftIdx = LEFT_HE_COLS.indexOf(col);
  if (leftIdx >= 0) return { half: 'left', index: leftIdx };
  const rightIdx = RIGHT_HE_COLS.indexOf(col);
  if (rightIdx >= 0) return { half: 'right', index: rightIdx };
  return null;
}

// Embedded from zmk-config-heball/config/heball.json
export const HEBALL_LAYOUT: LayoutKey[] = [
  { col:  0, x: 0,        y: 0.25  },
  { col:  1, x: 1,        y: 0.25  },
  { col:  2, x: 2,        y: 0.125 },
  { col:  3, x: 3,        y: 0     },
  { col:  4, x: 4,        y: 0.125 },
  { col:  5, x: 5,        y: 0.25  },
  { col:  6, x: 0,        y: 1.25  },
  { col:  7, x: 1,        y: 1.25  },
  { col:  8, x: 2,        y: 1.125 },
  { col:  9, x: 3,        y: 1     },
  { col: 10, x: 4,        y: 1.125 },
  { col: 11, x: 5,        y: 1.25  },
  { col: 12, x: 6,        y: 1.38  },
  { col: 13, x: 0,        y: 2.25  },
  { col: 14, x: 1,        y: 2.25  },
  { col: 15, x: 2,        y: 2.125 },
  { col: 16, x: 3,        y: 2     },
  { col: 17, x: 4,        y: 2.125 },
  { col: 18, x: 5,        y: 2.25  },
  { col: 19, x: 6,        y: 2.38  },
  { col: 20, x: 0,        y: 3.25  },
  { col: 21, x: 1,        y: 3.25  },
  { col: 22, x: 2,        y: 3.125 },
  { col: 23, x: 3,        y: 3     },
  { col: 24, x: 4.5,      y: 3.5   },
  { col: 25, x: 5.5,      y: 3.5,      r: 10,  rx: 5.5,      ry: 4.5     },
  { col: 26, x: 6.484808, y: 3.673648, r: 20,  rx: 6.484808, ry: 4.673648 },
  { col: 27, x: 7.15,     y: 1.38  },
  { col: 28, x: 10.5,     y: 0.25  },
  { col: 29, x: 11.5,     y: 0.125 },
  { col: 30, x: 12.5,     y: 0     },
  { col: 31, x: 13.5,     y: 0.125 },
  { col: 32, x: 14.5,     y: 0.25  },
  { col: 33, x: 15.5,     y: 0.25  },
  { col: 34, x: 9.5,      y: 1.38  },
  { col: 35, x: 10.5,     y: 1.25  },
  { col: 36, x: 11.5,     y: 1.125 },
  { col: 37, x: 12.5,     y: 1     },
  { col: 38, x: 13.5,     y: 1.125 },
  { col: 39, x: 14.5,     y: 1.25  },
  { col: 40, x: 15.5,     y: 1.25  },
  { col: 41, x: 9.5,      y: 2.38  },
  { col: 42, x: 10.5,     y: 2.25  },
  { col: 43, x: 11.5,     y: 2.125 },
  { col: 44, x: 12.5,     y: 2     },
  { col: 45, x: 13.5,     y: 2.125 },
  { col: 46, x: 14.5,     y: 2.25  },
  { col: 47, x: 15.5,     y: 2.25  },
  { col: 48, x: 9.015192, y: 3.673648, r: 340, rx: 10.015192, ry: 4.673648 },
  { col: 49, x: 10,       y: 3.5,      r: 350, rx: 11,        ry: 4.5      },
  { col: 50, x: 14.5,     y: 3.25  },
  { col: 51, x: 15.5,     y: 3.25  },
  { col: 52, x: 8.35,     y: 1.38  },
];
