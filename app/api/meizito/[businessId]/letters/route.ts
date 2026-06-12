import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';
import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import {
  createInternalLetter,
  loadLettersSnapshot,
  type CreateInternalLetterInput,
} from '@/src/lib/meizito/letters/server';

type RouteParams = { params: Promise<{ businessId: string }> };

const boxSchema = z.enum(['inbox', 'outbox', 'archive']).optional();

const createSchema = z.object({
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
  replyToLetterId: z.string().optional(),
  threadId: z.string().optional(),
  attachments: z.array(z.unknown()).optional(),
});

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    await requireMeizitoAccess(req, businessId);
    const boxParam = req.nextUrl.searchParams.get('box');
    const box = boxParam ? boxSchema.parse(boxParam) : undefined;
    const snapshot = await loadLettersSnapshot(businessId, box);
    return jsonOk(snapshot);
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.letters.list');
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    const access = await requireMeizitoAccess(req, businessId);
    const body = createSchema.parse(await req.json());
    const letter = await createInternalLetter(
      businessId,
      body as CreateInternalLetterInput,
      access.user.id,
      access.user.displayName ?? access.user.username
    );
    return jsonOk({ letter }, { status: 201 });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.letters.create');
  }
}
