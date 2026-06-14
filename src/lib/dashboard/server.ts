import { prisma } from '@/src/lib/db/prisma';
import { createLogger } from '@/src/lib/logger';
import type { DashboardSummary } from '@/src/lib/dashboard/types';

const log = createLogger('dashboard');

const PERSIAN_WEEKDAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];

function cardIdsFromJson(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === 'string');
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function weekdayLabel(date: Date): string {
  return PERSIAN_WEEKDAYS[date.getDay()] ?? '';
}

function averageDeliveryDays(
  cards: Array<{ createdAt: Date; updatedAt: Date; columnId: string }>,
  lastColumnIds: Set<string>
): number | null {
  const done = cards.filter((c) => lastColumnIds.has(c.columnId));
  if (done.length === 0) return null;
  const totalDays = done.reduce((acc, card) => {
    const ms = card.updatedAt.getTime() - card.createdAt.getTime();
    return acc + Math.max(0, ms / (1000 * 60 * 60 * 24));
  }, 0);
  return Math.round(totalDays / done.length);
}

async function buildChartData(businessId: string): Promise<DashboardSummary['chartData']> {
  const today = startOfDay(new Date());
  const from = new Date(today);
  from.setDate(from.getDate() - 6);

  const [requests, visits] = await Promise.all([
    prisma.internalRequest.findMany({
      where: { businessId, createdAt: { gte: from } },
      select: { createdAt: true },
    }),
    prisma.fieldVisit.findMany({
      where: { businessId, createdAt: { gte: from } },
      select: { createdAt: true },
    }),
  ]);

  const salesByDay = new Map<string, number>();
  const visitsByDay = new Map<string, number>();

  for (let i = 0; i < 7; i += 1) {
    const day = new Date(from);
    day.setDate(from.getDate() + i);
    const key = day.toISOString().slice(0, 10);
    salesByDay.set(key, 0);
    visitsByDay.set(key, 0);
  }

  for (const row of requests) {
    const key = startOfDay(row.createdAt).toISOString().slice(0, 10);
    if (salesByDay.has(key)) salesByDay.set(key, (salesByDay.get(key) ?? 0) + 1);
  }

  for (const row of visits) {
    const key = startOfDay(row.createdAt).toISOString().slice(0, 10);
    if (visitsByDay.has(key)) visitsByDay.set(key, (visitsByDay.get(key) ?? 0) + 1);
  }

  const points: DashboardSummary['chartData'] = [];
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(from);
    day.setDate(from.getDate() + i);
    const key = day.toISOString().slice(0, 10);
    points.push({
      name: weekdayLabel(day),
      sales: salesByDay.get(key) ?? 0,
      visits: visitsByDay.get(key) ?? 0,
    });
  }

  return points;
}

async function buildProductionStatus(businessId: string): Promise<DashboardSummary['productionStatus']> {
  const boards = await prisma.workspaceBoard.findMany({
    where: { businessId },
    orderBy: { sortOrder: 'asc' },
    take: 4,
    include: {
      columns: { orderBy: { order: 'asc' } },
      cards: { select: { id: true } },
    },
  });

  return boards.map((board) => {
    const total = board.cards.length;
    if (total === 0) return { label: board.name, value: 0 };
    const lastCol = board.columns[board.columns.length - 1];
    const doneCount = lastCol ? cardIdsFromJson(lastCol.cardIds).length : 0;
    const value = Math.min(100, Math.round((doneCount / total) * 100));
    return { label: board.name, value };
  });
}

export async function loadDashboardSummary(businessId: string): Promise<DashboardSummary> {
  const business = await prisma.business.findFirstOrThrow({
    where: { id: businessId, status: 'active' },
    select: { name: true },
  });

  const [peopleCount, boards, chartData, productionStatus] = await Promise.all([
    prisma.businessMember.count({ where: { businessId } }),
    prisma.workspaceBoard.findMany({
      where: { businessId },
      include: {
        columns: { orderBy: { order: 'asc' } },
        cards: { select: { id: true, columnId: true, createdAt: true, updatedAt: true } },
      },
    }),
    buildChartData(businessId),
    buildProductionStatus(businessId),
  ]);

  const lastColumnIds = new Set<string>();
  const allCards: Array<{ createdAt: Date; updatedAt: Date; columnId: string }> = [];
  for (const board of boards) {
    const lastCol = board.columns[board.columns.length - 1];
    if (lastCol) lastColumnIds.add(lastCol.id);
    for (const card of board.cards) allCards.push(card);
  }

  const avgDeliveryDays = averageDeliveryDays(allCards, lastColumnIds);

  const summary: DashboardSummary = {
    businessName: business.name,
    stats: {
      receiptTotal: 0,
      paymentTotal: 0,
      peopleCount,
      avgDeliveryDays,
    },
    chartData,
    productionStatus,
  };

  log.info('dashboard.summary', {
    businessId,
    peopleCount,
    boards: boards.length,
    cards: allCards.length,
  });

  return summary;
}
