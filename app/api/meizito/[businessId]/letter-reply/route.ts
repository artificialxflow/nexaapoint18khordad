import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import {
  replyToInternalLetter,
  type CreateInternalLetterInput,
} from '@/src/lib/meizito/letters/server';

type RouteParams = { params: Promise<{ businessId: string }> };

const replySchema = z.object({
  sourceLetterId: z.string().min(1),
  subject: z.string().min(1).max(500),
  body: z.string().default(''),
  to: z.array(z.string()).default([]),
  labels: z.array(z.string()).default([]),
  category: z.enum(['financial', 'administrative', 'hr', 'operations', 'other']).optional(),
  status: z.enum(['open', 'closed']).optional(),
  box: z.enum(['inbox', 'outbox', 'archive']).optional(),
  templateId: z.string().optional(),
  referredTo: z.array(z.string()).default([]),
  referredFrom: z.string().default(''),
  attachments: z.array(z.unknown()).optional(),
});

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = replySchema.parse(await req.json());
    const { sourceLetterId, ...input } = body;
    const letter = await replyToInternalLetter(
      businessId,
      sourceLetterId,
      input as Omit<CreateInternalLetterInput, 'replyToLetterId' | 'threadId'>,
      access.user.id,
      access.user.displayName ?? access.user.username
    );
    return jsonOk({ letter }, { status: 201 });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.letters.reply');
  }
}
