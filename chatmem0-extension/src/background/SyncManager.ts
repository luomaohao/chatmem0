import { Conversation, SyncTask, SyncConfig, ProcessedConversation, ChromeMessage } from '../types';
import { Queue, generateId } from '../common/utils';
import { DataProcessingEngine } from './DataProcessingEngine';
import { StorageManager } from './StorageManager';

export class SyncManager {
  private syncQueue: Queue<SyncTask> = new Queue();
  private isProcessing: boolean = false;
  private config: SyncConfig;
  private dataProcessor: DataProcessingEngine;
  private storageManager: StorageManager;
  
  constructor(config: SyncConfig, dataProcessor: DataProcessingEngine, storageManager: StorageManager) {
    this.config = config;
    this.dataProcessor = dataProcessor;
    this.storageManager = storageManager;
  }
  
  async addToQueue(conversation: Conversation, tabId?: number): Promise<void> {
    const task: SyncTask = {
      id: generateId(),
      conversation: conversation,
      tabId: tabId,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };
    
    this.syncQueue.enqueue(task);
    console.log(`[SyncManager] Task added to queue: ${task.id}`);
    
    if (!this.isProcessing) {
      this.processSyncQueue();
    }
  }
  
  async syncAll(): Promise<void> {
    // 获取所有存储的对话并重新同步
    const conversations = await this.storageManager.getAllConversations();
    
    for (const conversation of Object.values(conversations)) {
      await this.addToQueue(conversation as Conversation);
    }
    
    console.log(`[SyncManager] Queued ${Object.keys(conversations).length} conversations for sync`);
  }
  
  private async processSyncQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    console.log('[SyncManager] Starting queue processing');
    
    while (!this.syncQueue.isEmpty()) {
      const task = this.syncQueue.dequeue();
      if (task) {
        await this.processTask(task);
      }
    }
    
    this.isProcessing = false;
    console.log('[SyncManager] Queue processing completed');
  }
  
  private async processTask(task: SyncTask): Promise<void> {
    try {
      console.log(`[SyncManager] Processing task: ${task.id}`);
      
      // 更新同步状态
      await this.storageManager.updateSyncStatus(task.conversation.id, {
        conversationId: task.conversation.id,
        status: 'syncing',
        updatedAt: new Date().toISOString()
      });
      
      // 数据处理
      const processedConversation = await this.dataProcessor.processConversation(task.conversation);

      // 优先本地保存，保证可见性
      await this.storageManager.saveConversation(processedConversation);

      // 再发送到后端
      await this.sendToBackend(processedConversation);
      
      // 更新同步状态为成功
      await this.storageManager.updateSyncStatus(task.conversation.id, {
        conversationId: task.conversation.id,
        status: 'success',
        updatedAt: new Date().toISOString()
      });
      
      // 通知UI更新
      this.notifyUI('SYNC_SUCCESS', { conversationId: task.conversation.id });
      
    } catch (error) {
      console.error(`[SyncManager] Task ${task.id} failed:`, error);
      await this.handleSyncError(task, error as Error);
    }
  }
  
  private async handleSyncError(task: SyncTask, error: Error): Promise<void> {
    task.retryCount++;
    
    if (task.retryCount < this.config.maxRetries) {
      // 重新加入队列，延迟重试
      setTimeout(() => {
        this.syncQueue.enqueue(task);
        if (!this.isProcessing) {
          this.processSyncQueue();
        }
      }, this.config.retryDelay * Math.pow(2, task.retryCount));
      
      console.log(`[SyncManager] Task ${task.id} will retry (attempt ${task.retryCount + 1}/${this.config.maxRetries})`);
    } else {
      // 最终失败处理
      await this.handleFinalFailure(task, error);
    }
  }
  
  private async handleFinalFailure(task: SyncTask, error: Error): Promise<void> {
    console.error(`[SyncManager] Task ${task.id} failed permanently:`, error);
    
    // 更新同步状态为错误
    await this.storageManager.updateSyncStatus(task.conversation.id, {
      conversationId: task.conversation.id,
      status: 'error',
      error: error.message,
      updatedAt: new Date().toISOString()
    });
    
    // 通知UI错误
    this.notifyUI('SYNC_ERROR', { 
      conversationId: task.conversation.id,
      error: error.message 
    });
  }
  
  private async sendToBackend(conversation: ProcessedConversation): Promise<void> {
    const config = await this.storageManager.getConfig();
    
    // 若未配置端点，则跳过上传，不视为错误
    if (!config.apiEndpoint || config.apiEndpoint.trim() === '') {
      console.warn('[SyncManager] Skipping backend sync: API endpoint not configured');
      return;
    }

    // 规范化 URL，避免重复斜杠
    const base = config.apiEndpoint.replace(/\/+$/, '');
    const url = `${base}/conversations`;

    // 仅在有 token 时附带 Authorization
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (config.authToken && config.authToken.trim().length > 0) {
      headers['Authorization'] = `Bearer ${config.authToken.trim()}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(conversation)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend sync failed: ${response.status} - ${errorText}`);
    }
    
    console.log(`[SyncManager] Successfully synced conversation: ${conversation.id}`);
  }
  
  private notifyUI(type: 'SYNC_SUCCESS' | 'SYNC_ERROR', data: any): void {
    // 发送消息到所有打开的标签页
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type, data }, () => {
            // 忽略连接错误（可能标签页没有加载扩展）
            if (chrome.runtime.lastError) {
              // Silent fail
            }
          });
        }
      });
    });
  }
}