import { NextRequest } from 'next/server';
import { handleAuthRouteError, jsonOk } from '@/src/lib/auth/api';import { requireMeizitoAccess } from '@/src/lib/meizito/access';
import { meizitoModuleLog } from '@/src/lib/meizito/logger';
import { queryTeamDirectory } from '@/src/lib/meizito/team-server';
import type { TeamDirectoryFilter } from '@/src/lib/meizito/approval';

const log = meizitoModuleLog('team-directory');

type RouteParams = { params: Promise<{ businessId: string }> };

function parseFilter(raw: string | null): TeamDirectoryFilter {
  if (!raw || raw === 'all' || raw === 'managers') return raw ?? 'all';
  return raw;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params;
    await requireMeizitoAccess(req, businessId);

    const { searchParams } = new URL(req.url);
    const filter = parseFilter(searchParams.get('filter'));
    const q = searchParams.get('q') ?? searchParams.get('search') ?? '';

    const members = await queryTeamDirectory(businessId, filter, q);
    const allMembers =
      filter === 'all' && !q.trim()
        ? members
        : await queryTeamDirectory(businessId, 'all', '');

    log.info('team-directory.list', { businessId, filter, q: q.trim() || undefined, resultCount: members.length });

    return jsonOk({ members, allMembers });
  } catch (err) {
    return handleAuthRouteError(err, 'meizito.team-directory.list');
  }
}
