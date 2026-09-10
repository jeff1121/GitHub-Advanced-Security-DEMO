import { describe, it, expect } from 'vitest';
import { BingoDrawer } from '../src/game/drawer';

describe('Bingo Drawer Engine (T-204)', () => {
  it('should draw 75 unique numbers without repetition and finish', () => {
    const drawer = new BingoDrawer();
    const drawnSet = new Set<number>();

    for (let seq = 1; seq <= 75; seq++) {
      const drawn = drawer.drawNext();
      expect(drawn).not.toBeNull();
      expect(drawn!.sequence).toBe(seq);
      expect(drawn!.number).toBeGreaterThanOrEqual(1);
      expect(drawn!.number).toBeLessThanOrEqual(75);
      expect(drawnSet.has(drawn!.number)).toBe(false);
      drawnSet.add(drawn!.number);
    }

    expect(drawnSet.size).toBe(75);
    expect(drawer.isComplete()).toBe(true);
    expect(drawer.getRemainingCount()).toBe(0);

    // 76th draw must return null
    const endDraw = drawer.drawNext();
    expect(endDraw).toBeNull();
  });
});
