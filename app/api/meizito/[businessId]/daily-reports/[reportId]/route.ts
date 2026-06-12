import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import {
  addDailyReportFeedback,
  updateDailyReport,
} from '@/src/lib/meizito/workspace/server';

type RouteParams = { params: Promise<{ businessId: string; reportId: string }> };

const patchSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  status: z.enum(['draft', 'submitted']).optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId, reportId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = patchSchema.parse(await req.json());
    const report = await updateDailyReport(businessId, reportId, body, access.user.id);
    return jsonOk({ report });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.dailyReports.patch');
  }
}
