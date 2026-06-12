import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { addDailyReportFeedback } from '@/src/lib/meizito/workspace/server';

type RouteParams = { params: Promise<{ businessId: string; reportId: string }> };

const bodySchema = z.object({
  feedback: z.string().min(1),
  kind: z.enum(['feedback', 'approve']).optional(),
});

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId, reportId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = bodySchema.parse(await req.json());
    const report = await addDailyReportFeedback(
      businessId,
      reportId,
      access.user.id,
      body.feedback,
      body.kind ?? 'feedback'
    );
    return jsonOk({ report });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.dailyReports.feedback');
  }
}
