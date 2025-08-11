import { AppConfig, PlatformStatus, ChromeMessage } from '../types';
import { formatTime } from '../common/utils';
import './popup.css';

class PopupManager {
  private currentTab: string = 'status';
  private config: AppConfig | null = null;
  private platforms = ['ChatGPT', 'Claude', '文心一言', '通义千问'];
  
  constructor() {
    this.init();
  }
  
  private async init() {
    await this.loadConfig();
    this.setupEventListeners();
    this.showTab('status');
    await this.refreshStatus();
  }
  
  private setupEventListeners() {
    // 标签页切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const tab = target.getAttribute('data-tab');
        if (tab) this.showTab(tab);
      });
    });
    
    // 状态页面
    document.getElementById('refresh-status')?.addEventListener('click', () => {
      this.refreshStatus();
    });
    
    // 配置页面
    document.getElementById('save-config')?.addEventListener('click', () => {
      this.saveConfig();
    });
    
    document.getElementById('reset-config')?.addEventListener('click', () => {
      this.resetConfig();
    });
    
    document.getElementById('show-token')?.addEventListener('click', () => {
      this.toggleTokenVisibility();
    });
    
    // 手动操作页面
    document.getElementById('sync-all')?.addEventListener('click', () => {
      this.syncAll();
    });
    
    document.getElementById('cleanup-data')?.addEventListener('click', () => {
      this.cleanupData();
    });
    
    document.getElementById('clear-all-data')?.addEventListener('click', () => {
      this.clearAllData();
    });
    
    document.getElementById('export-data')?.addEventListener('click', () => {
      this.exportData();
    });
    
    document.getElementById('import-data')?.addEventListener('click', () => {
      document.getElementById('import-file')?.click();
    });
    
    document.getElementById('import-file')?.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        this.importData(target.files[0]);
      }
    });
  }
  
  private showTab(tabName: string) {
    // 更新标签按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });
    
    // 显示对应的面板
    document.querySelectorAll('.tab-panel').forEach(panel => {
      const panelId = panel.id;
      const shouldShow = panelId === `${tabName}-tab`;
      panel.classList.toggle('active', shouldShow);
    });
    
    this.currentTab = tabName;
    
    // 如果切换到配置页面，加载配置
    if (tabName === 'config') {
      this.loadConfigToForm();
    }
  }
  
  private async refreshStatus() {
    try {
      // 获取存储信息
      const response = await this.sendMessage({ type: 'GET_STATUS' });
      
      if (response.error) {
        this.showNotification('获取状态失败', 'error');
        return;
      }
      
      // 更新平台状态
      await this.updatePlatformStatuses();
      
      // 更新统计信息
      await this.updateOverallStats();
      
    } catch (error) {
      console.error('Failed to refresh status:', error);
      this.showNotification('刷新状态失败', 'error');
    }
  }
  
  private async updatePlatformStatuses() {
    const container = document.getElementById('platform-statuses');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 获取每个平台的状态
    for (const platform of this.platforms) {
      const status = await this.getPlatformStatus(platform);
      const element = this.createPlatformStatusElement(platform, status);
      container.appendChild(element);
    }
  }
  
  private async getPlatformStatus(platform: string): Promise<PlatformStatus> {
    // 从存储中获取平台相关的对话数量
    const conversations = await chrome.storage.local.get('conversations');
    const allConversations = conversations.conversations || {};
    
    const platformConversations = Object.values(allConversations).filter(
      (conv: any) => conv.platform === platform
    );
    
    const lastActivity = platformConversations.length > 0
      ? Math.max(...platformConversations.map((conv: any) => 
          new Date(conv.updatedAt).getTime()
        ))
      : null;
    
    return {
      platform,
      isActive: platformConversations.length > 0,
      conversationCount: platformConversations.length,
      lastActivity: lastActivity ? new Date(lastActivity).toISOString() : undefined
    };
  }
  
  private createPlatformStatusElement(platform: string, status: PlatformStatus): HTMLElement {
    const element = document.createElement('div');
    element.className = 'platform-status';
    element.innerHTML = `
      <div class="platform-info">
        <span class="platform-name">${platform}</span>
        <span class="status-indicator ${status.isActive ? 'active' : 'inactive'}">
          ${status.isActive ? '●' : '○'}
        </span>
      </div>
      <div class="platform-stats">
        <span class="conversations-count">${status.conversationCount} 对话</span>
        <span class="last-activity">${status.lastActivity ? formatTime(status.lastActivity) : '无活动'}</span>
      </div>
    `;
    return element;
  }
  
  private async updateOverallStats() {
    const conversations = await chrome.storage.local.get('conversations');
    const allConversations = Object.values(conversations.conversations || {});
    
    // 总对话数
    document.getElementById('total-conversations')!.textContent = 
      allConversations.length.toString();
    
    // 今日同步数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySynced = allConversations.filter((conv: any) => 
      new Date(conv.processedAt || conv.updatedAt) >= today
    ).length;
    document.getElementById('today-synced')!.textContent = todaySynced.toString();
    
    // 最后同步时间
    if (allConversations.length > 0) {
      const lastSync = Math.max(...allConversations.map((conv: any) => 
        new Date(conv.processedAt || conv.updatedAt).getTime()
      ));
      document.getElementById('last-sync')!.textContent = formatTime(new Date(lastSync).toISOString());
    }
    
    // 存储使用量
    const storageInfo = await chrome.storage.local.getBytesInUse();
    const sizeInKB = Math.round(storageInfo / 1024);
    document.getElementById('storage-used')!.textContent = `${sizeInKB} KB`;
  }
  
  private async loadConfig() {
    const result = await chrome.storage.sync.get('config');
    this.config = result.config || {
      autoSync: false,
      syncInterval: 300,
      dataRetentionDays: 30,
      apiEndpoint: '',
      authToken: '',
      enabledPlatforms: this.platforms
    };
  }
  
  private loadConfigToForm() {
    if (!this.config) return;
    
    // 同步设置
    (document.getElementById('auto-sync') as HTMLInputElement).checked = this.config.autoSync;
    (document.getElementById('sync-interval') as HTMLInputElement).value = this.config.syncInterval.toString();
    (document.getElementById('retention-days') as HTMLInputElement).value = this.config.dataRetentionDays.toString();
    
    // 服务器设置
    (document.getElementById('api-endpoint') as HTMLInputElement).value = this.config.apiEndpoint;
    (document.getElementById('auth-token') as HTMLInputElement).value = this.config.authToken;
    
    // 平台设置
    const platformToggles = document.getElementById('platform-toggles');
    if (platformToggles) {
      platformToggles.innerHTML = '';
      this.platforms.forEach(platform => {
        const toggle = document.createElement('div');
        toggle.className = 'platform-toggle';
        toggle.innerHTML = `
          <label class="switch">
            <input type="checkbox" data-platform="${platform}" 
              ${this.config!.enabledPlatforms.includes(platform) ? 'checked' : ''}>
            <span class="slider"></span>
            <span class="label-text">${platform}</span>
          </label>
        `;
        platformToggles.appendChild(toggle);
      });
    }
  }
  
  private async saveConfig() {
    const enabledPlatforms = Array.from(
      document.querySelectorAll('#platform-toggles input[type="checkbox"]:checked')
    ).map(input => input.getAttribute('data-platform')!);
    
    // 读取并规范化端点，允许不填token
    let apiEndpoint = (document.getElementById('api-endpoint') as HTMLInputElement).value.trim();
    apiEndpoint = apiEndpoint.replace(/\/+$/, '');

    const newConfig: AppConfig = {
      autoSync: (document.getElementById('auto-sync') as HTMLInputElement).checked,
      syncInterval: parseInt((document.getElementById('sync-interval') as HTMLInputElement).value),
      dataRetentionDays: parseInt((document.getElementById('retention-days') as HTMLInputElement).value),
      apiEndpoint,
      authToken: (document.getElementById('auth-token') as HTMLInputElement).value.trim(),
      enabledPlatforms
    };
    
    await chrome.storage.sync.set({ config: newConfig });
    this.config = newConfig;
    
    // 通知background更新配置
    await this.sendMessage({ type: 'CONFIG_UPDATED', config: newConfig });
    
    // 简单校验提示（无需认证）：提示已保存，若未填端点给出温馨提示
    if (!apiEndpoint) {
      this.showNotification('设置已保存：未配置API端点，将仅本地保存', 'warning');
    } else {
      this.showNotification('设置已保存', 'success');
    }
  }
  
  private async resetConfig() {
    if (!confirm('确定要重置所有设置为默认值吗？')) return;
    
    const defaultConfig: AppConfig = {
      autoSync: false,
      syncInterval: 300,
      dataRetentionDays: 30,
      apiEndpoint: '',
      authToken: '',
      enabledPlatforms: this.platforms
    };
    
    await chrome.storage.sync.set({ config: defaultConfig });
    this.config = defaultConfig;
    this.loadConfigToForm();
    
    this.showNotification('设置已重置', 'success');
  }
  
  private toggleTokenVisibility() {
    const tokenInput = document.getElementById('auth-token') as HTMLInputElement;
    const showButton = document.getElementById('show-token') as HTMLButtonElement;
    
    if (tokenInput.type === 'password') {
      tokenInput.type = 'text';
      showButton.textContent = '隐藏';
    } else {
      tokenInput.type = 'password';
      showButton.textContent = '显示';
    }
  }
  
  private async syncAll() {
    try {
      this.showNotification('开始同步...', 'info');
      const response = await this.sendMessage({ type: 'SYNC_REQUEST' });
      
      if (response.success) {
        this.showNotification('同步任务已启动', 'success');
      } else {
        this.showNotification('同步失败: ' + response.error, 'error');
      }
    } catch (error) {
      this.showNotification('同步请求失败', 'error');
    }
  }
  
  private async cleanupData() {
    if (!confirm('确定要清理过期数据吗？')) return;
    
    try {
      // 直接调用存储管理器的清理功能
      const config = await chrome.storage.sync.get('config');
      const cutoffDate = new Date(Date.now() - (config.config?.dataRetentionDays || 30) * 24 * 60 * 60 * 1000);
      
      const conversations = await chrome.storage.local.get('conversations');
      const allConversations = conversations.conversations || {};
      
      const cleanedConversations: any = {};
      let removedCount = 0;
      
      Object.entries(allConversations).forEach(([id, conv]: [string, any]) => {
        if (new Date(conv.updatedAt) > cutoffDate) {
          cleanedConversations[id] = conv;
        } else {
          removedCount++;
        }
      });
      
      await chrome.storage.local.set({ conversations: cleanedConversations });
      
      this.showNotification(`已清理 ${removedCount} 个过期对话`, 'success');
      await this.refreshStatus();
    } catch (error) {
      this.showNotification('清理失败', 'error');
    }
  }
  
  private async clearAllData() {
    if (!confirm('确定要清除所有数据吗？此操作不可恢复！')) return;
    if (!confirm('再次确认：真的要清除所有数据吗？')) return;
    
    try {
      await chrome.storage.local.clear();
      this.showNotification('所有数据已清除', 'success');
      await this.refreshStatus();
    } catch (error) {
      this.showNotification('清除失败', 'error');
    }
  }
  
  private async exportData() {
    try {
      const data = await chrome.storage.local.get();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chatmem0-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      this.showNotification('数据导出成功', 'success');
    } catch (error) {
      this.showNotification('导出失败', 'error');
    }
  }
  
  private async importData(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // 验证数据格式
      if (!data.conversations) {
        throw new Error('无效的备份文件格式');
      }
      
      await chrome.storage.local.set(data);
      this.showNotification('数据导入成功', 'success');
      await this.refreshStatus();
    } catch (error) {
      this.showNotification('导入失败: ' + (error as Error).message, 'error');
    }
  }
  
  private sendMessage(message: ChromeMessage): Promise<any> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }
  
  private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    const notification = document.getElementById('notification');
    const messageEl = notification?.querySelector('.notification-message');
    
    if (!notification || !messageEl) return;
    
    messageEl.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');
    
    setTimeout(() => {
      notification.classList.add('hidden');
    }, 3000);
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});