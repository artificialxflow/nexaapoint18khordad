import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { createWorkspaceCard } from '@/src/lib/meizito/workspace/server';

type RouteParams = { params: Promise<{ businessId: string }> };

const createSchema = z.object({
  boardId: z.string().min(1),
  columnId: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  assignee: z.string().optional(),
  assigneeUserId: z.string().optional(),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  recurrence: z.enum(['none', 'daily', 'weekly']).optional(),
  category: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = createSchema.parse(await req.json());
    const card = await createWorkspaceCard(businessId, body, access.user.id);
    return jsonOk({ card }, { status: 201 });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.cards.create');
  }
}
