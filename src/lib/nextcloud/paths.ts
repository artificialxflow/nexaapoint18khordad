const NEXA_ROOT = '/Nexa';

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function ncPathForBusinessRoot(businessId: string) {
  return `${NEXA_ROOT}/${sanitizeId(businessId)}/`;
}

export function ncPathForPerson(personId: string) {
  return `${NEXA_ROOT}/people/${sanitizeId(personId)}/`;
}

/** Meizito workspace project — not AccountingProject (settings). */
export function ncPathForWorkspaceProject(businessId: string, projectId: string) {
  return `${ncPathForBusinessRoot(businessId)}projects/${sanitizeId(projectId)}/`;
}

/** @deprecated Use ncPathForWorkspaceProject with businessId */
export function ncPathForProject(projectId: string) {
  return `${NEXA_ROOT}/projects/${sanitizeId(projectId)}/`;
}

export function ncPathForMeizitoCard(businessId: string, boardId: string, cardId: string) {
  return `${ncPathForBusinessRoot(businessId)}meizito/boards/${sanitizeId(boardId)}/cards/${sanitizeId(cardId)}/`;
}

export function ncPathForLetter(businessId: string, letterId: string) {
  return `${ncPathForBusinessRoot(businessId)}meizito/letters/${sanitizeId(letterId)}/`;
}

export function ncPathForMeizitoLetterDrafts(businessId: string) {
  return `${ncPathForBusinessRoot(businessId)}meizito/letters/drafts/`;
}

export function ncPathForMeizitoRequests(businessId: string) {
  return `${ncPathForBusinessRoot(businessId)}meizito/requests/`;
}

export function ncPathForMeizitoNotes(businessId: string) {
  return `${ncPathForBusinessRoot(businessId)}meizito/notes/`;
}

export function ncPathForMeizitoChat(businessId: string, threadId: string) {
  return `${ncPathForBusinessRoot(businessId)}meizito/chat/${sanitizeId(threadId)}/`;
}

/** Legacy paths when active business is not set (dev / transition). */
export function resolveNcPathForMeizitoCard(
  businessId: string | null,
  boardId: string,
  cardId: string
) {
  if (businessId) return ncPathForMeizitoCard(businessId, boardId, cardId);
  return `${NEXA_ROOT}/meizito/boards/${sanitizeId(boardId)}/cards/${sanitizeId(cardId)}/`;
}

export function resolveNcPathForMeizitoChat(businessId: string | null, threadId: string) {
  if (businessId) return ncPathForMeizitoChat(businessId, threadId);
  return `${NEXA_ROOT}/meizito/chat/${sanitizeId(threadId)}/`;
}

export function resolveNcPathForWorkspaceProject(businessId: string | null, projectId: string) {
  if (businessId) return ncPathForWorkspaceProject(businessId, projectId);
  return ncPathForProject(projectId);
}

export function resolveNcPathForMeizitoLetterDrafts(businessId: string | null) {
  if (businessId) return ncPathForMeizitoLetterDrafts(businessId);
  return `${NEXA_ROOT}/meizito/letters/drafts/`;
}

export function resolveNcPathForMeizitoRequests(businessId: string | null) {
  if (businessId) return ncPathForMeizitoRequests(businessId);
  return `${NEXA_ROOT}/meizito/requests/`;
}

export function resolveNcPathForMeizitoNotes(businessId: string | null) {
  if (businessId) return ncPathForMeizitoNotes(businessId);
  return `${NEXA_ROOT}/meizito/notes/`;
}

export function ncPathForSalesInvoice(invoiceId: string) {
  return `${NEXA_ROOT}/sales/invoices/${sanitizeId(invoiceId)}/`;
}

export function ncPathForReceipt(receiptId: string) {
  return `${NEXA_ROOT}/receipts/${sanitizeId(receiptId)}/`;
}

export { NEXA_ROOT };
