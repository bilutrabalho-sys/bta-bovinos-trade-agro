// ============================================================================
//  mappers.ts — row (snake_case do Postgres) -> shape (camelCase do frontend)
// ----------------------------------------------------------------------------
//  As interfaces abaixo espelham EXATAMENTE os exports de src/data/mock.ts
//  (o CONTRATO das telas). Foram redeclaradas localmente de propósito, para
//  manter o servidor desacoplado do tsconfig do frontend (sem cruzar rootDir).
// ============================================================================
import type { Row } from './db';

// ---------------------------------------------------------------------------
//  Coerção defensiva. Com os type parsers de db.ts, numeric/bigint já chegam
//  como number; ainda assim coagimos aqui para honrar o contrato non-null do
//  mock mesmo quando a coluna do banco é nullable (mas o seed a preenche).
// ---------------------------------------------------------------------------
type PriceUnit = '/@' | '/cab';

function asString(v: unknown, fallback = ''): string {
  return v === null || v === undefined ? fallback : String(v);
}
function asNumber(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function asBool(v: unknown): boolean {
  return v === true || v === 't' || v === 'true' || v === 1;
}
function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)) : [];
}
function asPriceUnit(v: unknown): PriceUnit {
  return v === '/cab' ? '/cab' : '/@';
}
function asIso(v: unknown): string {
  return v instanceof Date ? v.toISOString() : asString(v);
}

/** Reconstrói o "time" relativo do mock (ex.: '2 min', '3h', '1d') a partir de created_at. */
function relativeTime(v: unknown): string {
  if (!(v instanceof Date)) return '';
  const diffMin = Math.max(0, Math.floor((Date.now() - v.getTime()) / 60000));
  if (diffMin < 60) return `${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/** 'base' -> 'Base', 'pessimista' -> 'Pessimista' (o mock usa capitalizado). */
function capitalize(v: unknown): string {
  const s = asString(v);
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}

// ============================================================================
//  LOTS  (GET /api/lots)
// ============================================================================
export interface Lot {
  id: number;
  title: string;
  category: string;
  breed: string;
  quantity: number;
  weight: number;
  price: number;
  priceUnit: PriceUnit;
  priceTotal: number;
  location: string;
  state: string;
  distance: number;
  freight: number;
  score: number;
  verified: boolean;
  sellerId: number;
  age: string;
  sex: string;
  purpose: string;
  image: string;
  images: string[];
  description: string;
}

export function mapLot(row: Row): Lot {
  return {
    id: asNumber(row.id),
    title: asString(row.title),
    category: asString(row.category),
    breed: asString(row.breed),
    quantity: asNumber(row.quantity),
    weight: asNumber(row.weight),
    price: asNumber(row.price),
    priceUnit: asPriceUnit(row.price_unit),
    priceTotal: asNumber(row.price_total),
    location: asString(row.location),
    state: asString(row.state),
    distance: asNumber(row.distance),
    freight: asNumber(row.freight),
    score: asNumber(row.score),
    verified: asBool(row.verified),
    sellerId: asNumber(row.seller_id),
    age: asString(row.age),
    sex: asString(row.sex),
    purpose: asString(row.purpose),
    image: asString(row.image),
    images: asStringArray(row.images),
    description: asString(row.description),
  };
}

// ============================================================================
//  FARMS  (GET /api/farms)
// ============================================================================
export interface Farm {
  id: number;
  name: string;
  rating: number;
  deals: number;
  completion: number;
  location: string;
  state: string;
  verified: boolean;
  specialties: string[];
  activeLots: number;
  since: string;
  description: string;
}

export function mapFarm(row: Row): Farm {
  return {
    id: asNumber(row.id),
    name: asString(row.name),
    rating: asNumber(row.rating),
    deals: asNumber(row.deals),
    completion: asNumber(row.completion),
    location: asString(row.location),
    state: asString(row.state),
    verified: asBool(row.verified),
    specialties: asStringArray(row.specialties),
    activeLots: asNumber(row.active_lots),
    since: asString(row.since_year),
    description: asString(row.description),
  };
}

// ============================================================================
//  MARKET  (GET /api/market)  -> MARKET_DATA
// ============================================================================
export interface MarketPoint {
  day: string;
  value: number;
}
export interface MarketEntry {
  current: number;
  change: number;
  unit: PriceUnit;
  color: string;
  source: string; // rótulo da fonte da cotação ("—" quando não informada)
  updatedAt: string; // data da última atualização (YYYY-MM-DD, do snapshot_at)
  history7: MarketPoint[];
  history30: MarketPoint[];
  history90: MarketPoint[];
}
export type MarketData = Record<string, MarketEntry>;

function pointsByCategory(rows: Row[]): Map<string, MarketPoint[]> {
  const m = new Map<string, MarketPoint[]>();
  for (const r of rows) {
    const cat = asString(r.category);
    const arr = m.get(cat) ?? [];
    arr.push({ day: asString(r.day), value: asNumber(r.value) });
    m.set(cat, arr);
  }
  return m;
}

export function buildMarketData(
  snapshots: Row[],
  series7: Row[],
  series30: Row[],
  series90: Row[],
): MarketData {
  const h7 = pointsByCategory(series7);
  const h30 = pointsByCategory(series30);
  const h90 = pointsByCategory(series90);
  const out: MarketData = {};
  for (const s of snapshots) {
    const cat = asString(s.category);
    out[cat] = {
      current: asNumber(s.current),
      change: asNumber(s.change),
      unit: asPriceUnit(s.unit),
      color: asString(s.color),
      source: asString(s.source, '—'),
      updatedAt: asString(s.updated_at),
      history7: h7.get(cat) ?? [],
      history30: h30.get(cat) ?? [],
      history90: h90.get(cat) ?? [],
    };
  }
  return out;
}

// ============================================================================
//  OPPORTUNITIES  (GET /api/opportunities)
// ============================================================================
export interface Opportunity {
  id: number;
  lotId: number;
  title: string;
  avgRegional: number;
  priceDiff: number;
  distance: number;
  freight: number;
  score: number;
  reason: string;
}

export function mapOpportunity(row: Row): Opportunity {
  return {
    id: asNumber(row.id),
    lotId: asNumber(row.lot_id),
    title: asString(row.title),
    avgRegional: asNumber(row.avg_regional),
    priceDiff: asNumber(row.price_diff),
    distance: asNumber(row.distance),
    freight: asNumber(row.freight),
    score: asNumber(row.score),
    reason: asString(row.reason),
  };
}

// ============================================================================
//  NOTIFICATIONS  (GET /api/notifications)
// ============================================================================
export interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export function mapNotification(row: Row): Notification {
  return {
    id: asNumber(row.id),
    type: asString(row.type),
    title: asString(row.title),
    body: asString(row.body),
    time: relativeTime(row.created_at),
    read: asBool(row.read),
  };
}

// ============================================================================
//  COURSES  (GET /api/courses)
// ============================================================================
export interface Course {
  id: number;
  title: string;
  category: string;
  duration: string;
  progress: number;
  level: string;
  xp: number;
}

export function mapCourse(row: Row): Course {
  return {
    id: asNumber(row.id),
    title: asString(row.title),
    category: asString(row.category),
    duration: asString(row.duration),
    progress: asNumber(row.progress),
    level: asString(row.level),
    xp: asNumber(row.xp),
  };
}

// ============================================================================
//  LESSONS  (GET /api/lessons)
// ============================================================================
export interface LessonSection {
  heading: string;
  body: string;
}
export interface QuizQuestion {
  q: string;
  opts: string[];
  answer: number;
}
export interface Lesson {
  id: number;
  title: string;
  category: string;
  level: string;
  duration: string;
  xp: number;
  sections: LessonSection[];
  keyConcepts: string[];
  quiz: QuizQuestion[];
}

function mapSections(v: unknown): LessonSection[] {
  if (!Array.isArray(v)) return [];
  return v.map((s) => {
    const o = (s ?? {}) as Row;
    return { heading: asString(o.heading), body: asString(o.body) };
  });
}
function mapQuiz(v: unknown): QuizQuestion[] {
  if (!Array.isArray(v)) return [];
  return v.map((q) => {
    const o = (q ?? {}) as Row;
    return { q: asString(o.q), opts: asStringArray(o.opts), answer: asNumber(o.answer) };
  });
}

export function mapLesson(row: Row): Lesson {
  return {
    id: asNumber(row.id),
    title: asString(row.title),
    category: asString(row.category),
    level: asString(row.level),
    duration: asString(row.duration),
    xp: asNumber(row.xp),
    sections: mapSections(row.sections),
    keyConcepts: asStringArray(row.key_concepts),
    quiz: mapQuiz(row.quiz),
  };
}

// ============================================================================
//  RADAR ALERTS  (GET /api/radar-alerts)
// ============================================================================
export interface RadarAlert {
  id: number;
  title: string;
  criteria: string;
  active: boolean;
  matches: number;
}

export function mapRadarAlert(row: Row): RadarAlert {
  return {
    id: asNumber(row.id),
    title: asString(row.title),
    criteria: asString(row.criteria_text),
    active: asBool(row.active),
    matches: asNumber(row.matches),
  };
}

// ============================================================================
//  MATCH RESULTS  (GET /api/match-results)  — sem id, conforme mock
// ============================================================================
export interface MatchResult {
  lotId: number;
  compatibility: number;
  highlight: string;
}

export function mapMatchResult(row: Row): MatchResult {
  return {
    lotId: asNumber(row.lot_id),
    compatibility: asNumber(row.compatibility),
    highlight: asString(row.highlight),
  };
}

// ============================================================================
//  CHAT MESSAGES  (GET /api/chat-messages)
// ============================================================================
export interface ChatMessage {
  id: number;
  from: string;
  text: string;
  time: string;
}

export function mapChatMessage(row: Row): ChatMessage {
  return {
    id: asNumber(row.id),
    from: asString(row.from),
    text: asString(row.text),
    time: asString(row.time),
  };
}

// ============================================================================
//  TRANSPORTERS  (GET /api/transporters)  — mock não expõe state
// ============================================================================
export interface Transporter {
  id: number;
  name: string;
  rating: number;
  trips: number;
  capacity: number;
  pricePerKm: number;
  verified: boolean;
  location: string;
  available: boolean;
}

export function mapTransporter(row: Row): Transporter {
  return {
    id: asNumber(row.id),
    name: asString(row.name),
    rating: asNumber(row.rating),
    trips: asNumber(row.trips),
    capacity: asNumber(row.capacity),
    pricePerKm: asNumber(row.price_per_km),
    verified: asBool(row.verified),
    location: asString(row.location),
    available: asBool(row.available),
  };
}

// ============================================================================
//  SERVICES  (GET /api/services)
// ============================================================================
export interface Service {
  id: number;
  name: string;
  icon: string;
  description: string;
  status: string;
}

export function mapService(row: Row): Service {
  return {
    id: asNumber(row.id),
    name: asString(row.name),
    icon: asString(row.icon),
    description: asString(row.description),
    status: asString(row.status),
  };
}

// ============================================================================
//  SAVED SIMULATIONS  (GET /api/saved-simulations)
// ============================================================================
export interface SavedSimulation {
  id: number;
  name: string;
  date: string;
  margin: number;
  investment: number;
  scenario: string;
}

export function mapSavedSimulation(row: Row): SavedSimulation {
  return {
    id: asNumber(row.id),
    name: asString(row.name),
    date: asString(row.date),
    margin: asNumber(row.margin),
    investment: asNumber(row.investment),
    scenario: capitalize(row.scenario),
  };
}

// ============================================================================
//  ESCRITA — respostas dos POST
// ============================================================================
export interface Favorite {
  id: number;
  userId: number;
  lotId: number | null;
  farmId: number | null;
  opportunityId: number | null;
  simulationId: number | null;
  lessonId: number | null;
  createdAt: string;
}

function asNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function mapFavorite(row: Row): Favorite {
  return {
    id: asNumber(row.id),
    userId: asNumber(row.user_id),
    lotId: asNumberOrNull(row.lot_id),
    farmId: asNumberOrNull(row.farm_id),
    opportunityId: asNumberOrNull(row.opportunity_id),
    simulationId: asNumberOrNull(row.simulation_id),
    lessonId: asNumberOrNull(row.lesson_id),
    createdAt: asIso(row.created_at),
  };
}

export interface Proposal {
  id: number;
  lotId: number;
  buyerUserId: number;
  sellerFarmId: number;
  proposedPrice: number;
  priceUnit: PriceUnit;
  quantity: number;
  status: string;
  createdAt: string;
}

export function mapProposal(row: Row): Proposal {
  return {
    id: asNumber(row.id),
    lotId: asNumber(row.lot_id),
    buyerUserId: asNumber(row.buyer_user_id),
    sellerFarmId: asNumber(row.seller_farm_id),
    proposedPrice: asNumber(row.proposed_price),
    priceUnit: asPriceUnit(row.price_unit),
    quantity: asNumber(row.quantity),
    status: asString(row.status),
    createdAt: asIso(row.created_at),
  };
}
