export type NcFileRef = {
  path: string;
  name: string;
  mimeType: string;
  size?: number;
  etag?: string;
  shareUrl?: string;
};

export type NcListItem = {
  path: string;
  name: string;
  type: 'file' | 'dir';
  size?: number;
  mimeType?: string;
};

export type NcListResponse = {
  items: NcListItem[];
  path: string;
};

export type NcStatusResponse = {
  configured: boolean;
  message?: string;
  filesBaseUrl?: string;
};
