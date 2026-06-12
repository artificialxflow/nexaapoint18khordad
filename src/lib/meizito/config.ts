/** Per-slice data source — flip to `api` when a menu phase is complete. */
export type MeizitoDataSource = 'mock' | 'api';

export type MeizitoDataSources = {
  teamDirectory: MeizitoDataSource;
  workspace: MeizitoDataSource;
  requests: MeizitoDataSource;
  letters: MeizitoDataSource;
  calendar: MeizitoDataSource;
  chat: MeizitoDataSource;
};

/** v10 — flip each slice to `api` when its menu phase completes. */
export const MEIZITO_DATA_SOURCES: MeizitoDataSources = {
  teamDirectory: 'api',
  workspace: 'api',
  requests: 'mock',
  letters: 'mock',
  calendar: 'mock',
  chat: 'mock',
};

export function useMockUserSwitcher(): boolean {
  return Object.values(MEIZITO_DATA_SOURCES).every((s) => s === 'mock');
}
