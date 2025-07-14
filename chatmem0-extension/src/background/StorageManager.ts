import { ProcessedConversation, AppConfig, SyncStatus } from '../types';

export class StorageManager {
  private readonly STORAGE_KEYS = {
    CONVERSATIONS: 'conversations',
    CONFIG: 'config',
    SYNC_STATUS: 'syncStatus'
  };
  
  async saveConversation(conversation: ProcessedConversation): Promise<void> {
    const stored = await this.getStoredConversations();
    stored[conversation.id] = conversation;
    
    await chrome.storage.local.set({
      [this.STORAGE_KEYS.CONVERSATIONS]: stored
    });
    
    console.log(`[StorageManager] Saved conversation: ${conversation.id}`);
  }
  
  async getConversation(id: string): Promise<ProcessedConversation | null> {
    const stored = await this.getStoredConversations();
    return stored[id] || null;
  }
  
  async getAllConversations(): Promise<Record<string, ProcessedConversation>> {
    return await this.getStoredConversations();
  }
  
  async getStoredConversations(): Promise<Record<string, ProcessedConversation>> {
    const result = await chrome.storage.local.get(this.STORAGE_KEYS.CONVERSATIONS);
    return result[this.STORAGE_KEYS.CONVERSATIONS] || {};
  }
  
  async updateSyncStatus(conversationId: string, status: SyncStatus): Promise<void> {
    const syncStatuses = await this.getSyncStatuses();
    syncStatuses[conversationId] = {
      ...status,
      updatedAt: new Date().toISOString()
    };
    
    await chrome.storage.local.set({
      [this.STORAGE_KEYS.SYNC_STATUS]: syncStatuses
    });
  }
  
  async getSyncStatus(conversationId: string): Promise<SyncStatus | null> {
    const statuses = await this.getSyncStatuses();
    return statuses[conversationId] || null;
  }
  
  async getAllSyncStatuses(): Promise<Record<string, SyncStatus>> {
    return await this.getSyncStatuses();
  }
  
  private async getSyncStatuses(): Promise<Record<string, SyncStatus>> {
    const result = await chrome.storage.local.get(this.STORAGE_KEYS.SYNC_STATUS);
    return result[this.STORAGE_KEYS.SYNC_STATUS] || {};
  }
  
  async saveConfig(config: AppConfig): Promise<void> {
    await chrome.storage.sync.set({
      [this.STORAGE_KEYS.CONFIG]: config
    });
    console.log('[StorageManager] Config saved');
  }
  
  async getConfig(): Promise<AppConfig> {
    const result = await chrome.storage.sync.get(this.STORAGE_KEYS.CONFIG);
    return result[this.STORAGE_KEYS.CONFIG] || {
      autoSync: false,
      syncInterval: 300,
      dataRetentionDays: 30,
      apiEndpoint: '',
      authToken: '',
      enabledPlatforms: ['ChatGPT', 'Claude', '文心一言', '通义千问']
    };
  }
  
  async cleanupOldData(): Promise<void> {
    const config = await this.getConfig();
    const cutoffDate = new Date(Date.now() - config.dataRetentionDays * 24 * 60 * 60 * 1000);
    
    const conversations = await this.getStoredConversations();
    const syncStatuses = await this.getSyncStatuses();
    
    const cleanedConversations: Record<string, ProcessedConversation> = {};
    const cleanedStatuses: Record<string, SyncStatus> = {};
    
    Object.entries(conversations).forEach(([id, conversation]) => {
      if (new Date(conversation.updatedAt) > cutoffDate) {
        cleanedConversations[id] = conversation;
        if (syncStatuses[id]) {
          cleanedStatuses[id] = syncStatuses[id];
        }
      }
    });
    
    await chrome.storage.local.set({
      [this.STORAGE_KEYS.CONVERSATIONS]: cleanedConversations,
      [this.STORAGE_KEYS.SYNC_STATUS]: cleanedStatuses
    });
    
    const removedCount = Object.keys(conversations).length - Object.keys(cleanedConversations).length;
    console.log(`[StorageManager] Cleaned up ${removedCount} old conversations`);
  }
  
  async getStorageInfo(): Promise<{
    conversationCount: number;
    totalSize: number;
    lastCleanup?: string;
  }> {
    const conversations = await this.getStoredConversations();
    const conversationCount = Object.keys(conversations).length;
    
    // 估算存储大小
    const dataStr = JSON.stringify(conversations);
    const totalSize = new Blob([dataStr]).size;
    
    return {
      conversationCount,
      totalSize
    };
  }
  
  async clearAllData(): Promise<void> {
    await chrome.storage.local.clear();
    console.log('[StorageManager] All local data cleared');
  }
}