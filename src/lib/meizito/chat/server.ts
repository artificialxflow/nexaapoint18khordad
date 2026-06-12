import type { Prisma } from '@prisma/client';
import { prisma } from '@/src/lib/db/prisma';
import { logMeizitoAction } from '@/src/lib/meizito/audit';
import { meizitoModuleLog } from '@/src/lib/meizito/logger';
import type { MeizitoChatMessage, MeizitoChatThread, MeizitoThreadType } from '@/src/types/meizito';
import type { NcFileRef } from '@/src/types/nextcloud';
import {
  serializeChatMessageRow,
  serializeChatThreadRow,
  type ChatSnapshot,
} from '@/src/lib/meizito/chat/serialize';

const log = meizitoModuleLog('chat');

async function getThreadOrThrow(businessId: string, threadId: string) {
  const row = await prisma.chatThread.findFirst({ where: { id: threadId, businessId } });
  if (!row) throw new Error('NOT_FOUND');
  return row;
}

async function getMessageOrThrow(businessId: string, messageId: string) {
  const row = await prisma.chatMessage.findFirst({ where: { id: messageId, businessId } });
  if (!row) throw new Error('NOT_FOUND');
  return row;
}

function buildMessageIdsByThread(messages: { id: string; threadId: string }[]) {
  const map = new Map<string, string[]>();
  for (const msg of messages) {
    const list = map.get(msg.threadId) ?? [];
    list.push(msg.id);
    map.set(msg.threadId, list);
  }
  return map;
}

export async function loadChatSnapshot(businessId: string): Promise<ChatSnapshot> {
  const [threadRows, messageRows] = await Promise.all([
    prisma.chatThread.findMany({
      where: { businessId },
      orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
    }),
    prisma.chatMessage.findMany({
      where: { businessId },
      orderBy: { createdAt: 'asc' },
    }),
  ]);
  const messageIdsByThread = buildMessageIdsByThread(messageRows);
  return {
    threads: threadRows.map((row) =>
      serializeChatThreadRow(row, messageIdsByThread.get(row.id) ?? [])
    ),
    messages: messageRows.map(serializeChatMessageRow),
  };
}

export async function createChatThread(
  businessId: string,
  title: string,
  threadType: MeizitoThreadType,
  participantNames: string[],
  actorId: string
) {
  const row = await prisma.chatThread.create({
    data: {
      businessId,
      title: title.trim() || 'گفتگوی جدید',
      threadType,
      participantNames,
    },
  });
  log.info('chat.thread.create', { businessId, threadId: row.id, actorId });
  await logMeizitoAction({
    actorId,
    action: 'chat.thread.create',
    businessId,
    targetType: 'chat_thread',
    targetId: row.id,
  });
  return serializeChatThreadRow(row, []);
}

export async function updateChatThread(
  businessId: string,
  threadId: string,
  patch: Partial<Pick<MeizitoChatThread, 'title' | 'starred' | 'pinned' | 'participantNames'>>,
  actorId: string
) {
  await getThreadOrThrow(businessId, threadId);
  const row = await prisma.chatThread.update({
    where: { id: threadId },
    data: {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.starred !== undefined ? { starred: patch.starred } : {}),
      ...(patch.pinned !== undefined ? { pinned: patch.pinned } : {}),
      ...(patch.participantNames !== undefined
        ? { participantNames: patch.participantNames }
        : {}),
    },
  });
  const messageIds = (
    await prisma.chatMessage.findMany({
      where: { businessId, threadId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    })
  ).map((m) => m.id);
  log.info('chat.thread.update', { businessId, threadId, actorId });
  return serializeChatThreadRow(row, messageIds);
}

export type CreateChatMessageInput = {
  threadId: string;
  authorName: string;
  body: string;
  type?: MeizitoChatMessage['type'];
  attachmentNames?: string[];
  attachmentRefs?: NcFileRef[];
  voiceDurationSec?: number;
};

export async function createChatMessage(
  businessId: string,
  input: CreateChatMessageInput,
  actorId: string
) {
  await getThreadOrThrow(businessId, input.threadId);
  const row = await prisma.chatMessage.create({
    data: {
      businessId,
      threadId: input.threadId,
      authorUserId: actorId,
      authorName: input.authorName,
      body: input.body ?? '',
      type: input.type ?? 'text',
      attachmentNames: input.attachmentNames ?? [],
      attachmentRefs: (input.attachmentRefs ?? []) as Prisma.InputJsonValue,
      voiceDurationSec: input.voiceDurationSec ?? null,
    },
  });
  await prisma.chatThread.update({
    where: { id: input.threadId },
    data: { updatedAt: new Date() },
  });
  log.info('chat.message.create', { businessId, threadId: input.threadId, messageId: row.id, actorId });
  await logMeizitoAction({
    actorId,
    action: 'chat.message.create',
    businessId,
    targetType: 'chat_message',
    targetId: row.id,
  });
  return serializeChatMessageRow(row);
}

export async function updateChatMessage(
  businessId: string,
  messageId: string,
  patch: Partial<Pick<MeizitoChatMessage, 'body' | 'editedAt'>>,
  actorId: string
) {
  await getMessageOrThrow(businessId, messageId);
  const row = await prisma.chatMessage.update({
    where: { id: messageId },
    data: {
      ...(patch.body !== undefined ? { body: patch.body } : {}),
      editedAt: patch.editedAt ? new Date(patch.editedAt) : new Date(),
    },
  });
  log.info('chat.message.update', { businessId, messageId, actorId });
  return serializeChatMessageRow(row);
}
