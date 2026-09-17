// What the car remembers between decisions: signs and crossings it has seen, and the car it set out to pass.
// Memory only holds things a sensor reported earlier; positions advance by odometry.
import { round } from './rng.mjs';

export class SignMemory {
  constructor() { this.seen = new Map(); this.active = { limit: 50, signId: null, passedZ: null }; }
  observe(signDetections, egoZ) {
    for (const s of signDetections) if (!this.seen.has(s.id)) this.seen.set(s.id, { id: s.id, limit: s.limit_kmh, z: egoZ + s.distance_m, passed: false });
  }
  update(egoZ) {
    for (const s of [...this.seen.values()].sort((a, b) => a.z - b.z)) {
      if (!s.passed && s.z <= egoZ) { s.passed = true; this.active = { limit: s.limit, signId: s.id, passedZ: s.z }; }
    }
  }
  snapshot(egoZ) {
    this.update(egoZ);
    const all = [...this.seen.values()].sort((a, b) => a.z - b.z);
    const ahead = all.filter(s => !s.passed);
    const passed = all.filter(s => s.passed).slice(-3);
    return {
      active_limit_kmh: this.active.limit,
      active_because: this.active.signId ? `${this.active.signId} (${this.active.limit}) passed ${round(egoZ - this.active.passedZ, 0)} m ago` : 'no sign passed yet; default 50',
      next_sign: ahead.length ? { id: ahead[0].id, limit_kmh: ahead[0].limit, distance_m: round(ahead[0].z - egoZ, 0) } : null,
      seen_ahead: ahead.map(s => ({ id: s.id, limit_kmh: s.limit, distance_m: round(s.z - egoZ, 0) })),
      recently_passed: passed.map(s => ({ id: s.id, limit_kmh: s.limit, metres_ago: round(egoZ - s.z, 0) }))
    };
  }
}

export class CrossingMemory {
  constructor() { this.seen = new Map(); }
  observe(crossingDetections, egoZ) {
    for (const c of crossingDetections) if (!this.seen.has(c.id)) this.seen.set(c.id, { id: c.id, z: egoZ + c.distance_m });
  }
  nextAhead(egoFrontZ) {
    return [...this.seen.values()].filter(c => c.z - 3 > egoFrontZ - 1).sort((a, b) => a.z - b.z)[0] || null;
  }
}
