import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import {
  addDailyReportFeedback,
  createDailyReport,
  updateDailyReport,
} from '@/src/lib/meizito/workspace/server';

type RouteParams = { params: Promise<{ businessId: string }> };

const createSchema = z.object({
  authorId: z.string(),
  authorName: z.string(),
  date: z.string(),
  title: z.string().default(''),
  body: z.string().default(''),
  status: z.enum(['draft', 'submitted']).default('draft'),
});

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = createSchema.parse(await req.json());
    const report = await createDailyReport(businessId, body, access.user.id);
    return jsonOk({ report }, { status: 201 });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.dailyReports.create');
  }
}
