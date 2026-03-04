export type Channel = {
  id: string;
  telegramId?: string;
  name: string;
  url: string;
  avatarUrl: string;
  description: string;
  subscribers: number;
  isActive?: boolean;
  lastFetchedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Post = {
  id: string;
  channelId: string;
  telegramMessageId: number;
  content: string;
  mediaUrl?: string;
  views: number;
  publishedAt: string;
  createdAt?: string;
  updatedAt?: string;
  isNew?: boolean; // UI only
};
