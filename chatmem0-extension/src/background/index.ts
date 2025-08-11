import { SyncManager } from './SyncManager';
import { StorageManager } from './StorageManager';
import { DataProcessingEngine } from './DataProcessingEngine';
import { ChromeMessage, AppConfig, SyncStatus } from '../types';

// 初始化各个管理器
const storageManager = new StorageManager();
const dataProcessor = new DataProcessingEngine();
const syncManager = new SyncManager(
  {
    maxRetries: 3,
    retryDelay: 1000,
    batchSize: 10
  },
  dataProcessor,
  storageManager
);

// 监听来自content scripts的消息
chrome.runtime.onMessage.addListener((message: ChromeMessage, sender, sendResponse) => {
  console.log('[Background] Received message:', message.type);
  
  switch (message.type) {
    case 'NEW_CONVERSATION':
      if (message.conversation) {
        syncManager.addToQueue(message.conversation, sender.tab?.id)
          .then(() => sendResponse({ success: true }))
          .catch(error => sendResponse({ success: false, error: error.message }));
      }
      return true; // 保持消息通道打开以进行异步响应
      
    case 'GET_STATUS':
      storageManager.getAllSyncStatuses()
        .then(statuses => sendResponse({ statuses }))
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'CONFIG_UPDATED':
      if (message.config) {
        handleConfigUpdate(message.config).then(() => sendResponse({ success: true })).catch(err => {
          console.error('[Background] Config update failed', err);
          sendResponse({ success: false, error: err?.message || String(err) });
        });
      }
      break;
      
    case 'SYNC_REQUEST':
      syncManager.syncAll()
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    default:
      console.warn('[Background] Unknown message type:', message.type);
  }
});

// 处理配置更新
async function handleConfigUpdate(config: AppConfig) {
  await storageManager.saveConfig(config);
  
  // 根据配置更新自动同步
  if (config.autoSync) {
    startAutoSync(config.syncInterval);
  } else {
    stopAutoSync();
  }
}

// 自动同步定时器
let autoSyncInterval: number | null = null;

function startAutoSync(intervalSeconds: number) {
  stopAutoSync(); // 清除现有定时器
  
  autoSyncInterval = setInterval(() => {
    syncManager.syncAll().catch(error => {
      console.error('[Background] Auto sync error:', error);
    });
  }, intervalSeconds * 1000) as unknown as number;
  
  console.log(`[Background] Auto sync started with interval: ${intervalSeconds}s`);
}

function stopAutoSync() {
  if (autoSyncInterval !== null) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
    console.log('[Background] Auto sync stopped');
  }
}

// 扩展安装或更新时的初始化
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Background] Extension installed/updated:', details.reason);
  
  // 初始化默认配置
  const config = await storageManager.getConfig();
  if (!config.apiEndpoint) {
    await storageManager.saveConfig({
      autoSync: false,
      syncInterval: 300, // 5分钟
      dataRetentionDays: 30,
      apiEndpoint: '',
      authToken: '',
      enabledPlatforms: ['ChatGPT', 'Claude', '文心一言', '通义千问']
    });
  }
  
  // 根据配置启动自动同步
  if (config.autoSync) {
    startAutoSync(config.syncInterval);
  }
});

// 定期清理过期数据
setInterval(async () => {
  try {
    await storageManager.cleanupOldData();
    console.log('[Background] Cleanup completed');
  } catch (error) {
    console.error('[Background] Cleanup error:', error);
  }
}, 24 * 60 * 60 * 1000); // 每24小时清理一次

// 监听浏览器启动
chrome.runtime.onStartup.addListener(async () => {
  console.log('[Background] Browser started');
  
  // 恢复自动同步
  const config = await storageManager.getConfig();
  if (config.autoSync) {
    startAutoSync(config.syncInterval);
  }
});

// 导出给其他模块使用
export { syncManager, storageManager, dataProcessor };