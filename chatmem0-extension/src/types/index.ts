// 消息角色类型
export type MessageRole = 'user' | 'assistant' | 'system';

// 内容类型
export type ContentType = 'text' | 'code' | 'image' | 'mixed';

// 消息结构
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  contentType: ContentType;
  timestamp: string;
  metadata?: Record<string, any>;
}

// 对话结构
export interface Conversation {
  id: string;
  platform: string;
  title: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  metadata?: Record<string, any>;
}

// 处理后的对话结构
export interface ProcessedConversation extends Conversation {
  processed: boolean;
  processedAt: string;
  tags?: string[];
  summary?: string;
}

// 平台选择器
export interface PlatformSelectors {
  conversationContainer: string;
  userMessage: string;
  assistantMessage: string;
  messageContent: string;
  timestamp?: string;
  conversationTitle: string | (() => string);
  conversationId: string | (() => string);
}

// 同步任务
export interface SyncTask {
  id: string;
  conversation: Conversation;
  tabId?: number;
  timestamp: string;
  retryCount: number;
}

// 同步配置
export interface SyncConfig {
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
}

// 同步状态
export interface SyncStatus {
  conversationId: string;
  status: 'pending' | 'syncing' | 'success' | 'error';
  error?: string;
  lastAttempt?: string;
  updatedAt: string;
}

// 平台状态
export interface PlatformStatus {
  platform: string;
  isActive: boolean;
  conversationCount: number;
  lastActivity?: string;
  error?: string;
}

// 应用配置
export interface AppConfig {
  autoSync: boolean;
  syncInterval: number;
  dataRetentionDays: number;
  apiEndpoint: string;
  authToken: string;
  enabledPlatforms: string[];
}

// 消息类型（用于组件间通信）
export type MessageType = 
  | 'NEW_CONVERSATION'
  | 'SYNC_REQUEST'
  | 'SYNC_SUCCESS'
  | 'SYNC_ERROR'
  | 'CONFIG_UPDATED'
  | 'GET_STATUS'
  | 'STATUS_RESPONSE';

// Chrome消息
export interface ChromeMessage {
  type: MessageType;
  data?: any;
  conversation?: Conversation;
  config?: AppConfig;
  status?: SyncStatus;
}