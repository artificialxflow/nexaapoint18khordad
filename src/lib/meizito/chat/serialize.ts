import type { MeizitoChatMessage, MeizitoChatThread } from '@/src/types/meizito';
import type { NcFileRef } from '@/src/types/nextcloud';

type ChatThreadRow = {
  id: string;
  businessId: string;
  title: string;
  threadType: MeizitoChatThread['threadType'];
  participantNames: unknown;
  starred: boolean;
  pinned: boolean;
};

type ChatMessageRow = {
  id: string;
  businessId: string;
  threadId: string;
  authorUserId: string | null;
  authorName: string;
  body: string;
  type: MeizitoChatMessage['type'];
  attachmentNames: unknown;
  attachmentRefs: unknown;
  voiceDurationSec: number | null;
  editedAt: Date | null;
  createdAt: Date;
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

function asAttachmentRefs(value: unknown): NcFileRef[] {
  return Array.isArray(value) ? (value as NcFileRef[]) : [];
}

export function serializeChatThreadRow(
  row: ChatThreadRow,
  messageIds: string[] = []
): MeizitoChatThread {
  return {
    id: row.id,
    title: row.title,
    threadType: row.threadType,
    participantNames: asStringArray(row.participantNames),
    starred: row.starred,
    pinned: row.pinned,
    messageIds,
  };
}

export function serializeChatMessageRow(row: ChatMessageRow): MeizitoChatMessage {
  return {
    id: row.id,
    threadId: row.threadId,
    author: row.authorName,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    type: row.type,
    attachmentNames: asStringArray(row.attachmentNames),
    attachmentRefs: asAttachmentRefs(row.attachmentRefs),
    voiceDurationSec: row.voiceDurationSec ?? undefined,
    editedAt: row.editedAt?.toISOString(),
  };
}

export type ChatSnapshot = {
  threads: MeizitoChatThread[];
  messages: MeizitoChatMessage[];
};
