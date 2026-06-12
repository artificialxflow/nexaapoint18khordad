import { meizitoFetch } from '@/src/lib/meizito/client';
import type { ChatSnapshot } from '@/src/lib/meizito/chat/serialize';
import type { MeizitoChatMessage, MeizitoChatThread, MeizitoThreadType } from '@/src/types/meizito';
import type { NcFileRef } from '@/src/types/nextcloud';

export async function fetchChatSnapshot(businessId: string): Promise<ChatSnapshot> {
  return meizitoFetch<ChatSnapshot>(businessId, '/chat');
}

export async function apiCreateChatThread(
  businessId: string,
  title: string,
  threadType: MeizitoThreadType,
  participantNames?: string[]
) {
  return meizitoFetch<{ thread: MeizitoChatThread }>(businessId, '/chat-threads', {
    method: 'POST',
    body: JSON.stringify({ title, threadType, participantNames: participantNames ?? [] }),
  });
}

export async function apiUpdateChatThread(
  businessId: string,
  threadId: string,
  patch: Partial<Pick<MeizitoChatThread, 'title' | 'starred' | 'pinned' | 'participantNames'>>
) {
  return meizitoFetch<{ thread: MeizitoChatThread }>(businessId, '/chat-thread-update', {
    method: 'PATCH',
    body: JSON.stringify({ threadId, ...patch }),
  });
}

export async function apiCreateChatMessage(
  businessId: string,
  input: {
    threadId: string;
    authorName: string;
    body: string;
    type?: MeizitoChatMessage['type'];
    attachmentNames?: string[];
    attachmentRefs?: NcFileRef[];
    voiceDurationSec?: number;
  }
) {
  return meizitoFetch<{ message: MeizitoChatMessage }>(businessId, '/chat-messages', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function apiUpdateChatMessage(
  businessId: string,
  messageId: string,
  patch: Partial<Pick<MeizitoChatMessage, 'body' | 'editedAt'>>
) {
  return meizitoFetch<{ message: MeizitoChatMessage }>(businessId, '/chat-message-update', {
    method: 'PATCH',
    body: JSON.stringify({ messageId, ...patch }),
  });
}
