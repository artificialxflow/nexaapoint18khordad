const NEXA_ROOT = '/Nexa';

export function ncPathForPerson(personId: string) {
  return `${NEXA_ROOT}/people/${personId}/`;
}

export function ncPathForProject(projectId: string) {
  return `${NEXA_ROOT}/projects/${projectId}/`;
}

export function ncPathForMeizitoCard(boardId: string, cardId: string) {
  return `${NEXA_ROOT}/meizito/boards/${boardId}/cards/${cardId}/`;
}

export function ncPathForLetter(letterId: string) {
  return `${NEXA_ROOT}/meizito/letters/${letterId}/`;
}

export function ncPathForMeizitoChat(threadId: string) {
  return `${NEXA_ROOT}/meizito/chat/${threadId}/`;
}

export function ncPathForSalesInvoice(invoiceId: string) {
  return `${NEXA_ROOT}/sales/invoices/${invoiceId}/`;
}

export function ncPathForReceipt(receiptId: string) {
  return `${NEXA_ROOT}/receipts/${receiptId}/`;
}

export { NEXA_ROOT };
