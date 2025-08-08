import { BaseExtractor } from '../common/BaseExtractor';
import { Conversation, PlatformSelectors, Message } from '../types';

class TongyiExtractor extends BaseExtractor {
  constructor() {
    super('通义千问');
  }
  
  getPlatformSelectors(): PlatformSelectors {
    return {
      // 通义千问的选择器需要根据实际页面结构调整
      conversationContainer: '.tongyi-message-item',
      userMessage: '.message-user',
      assistantMessage: '.message-assistant',
      messageContent: '.message-text',
      conversationTitle: () => this.extractTitleFromPage(),
      conversationId: () => this.extractConversationId()
    };
  }
  
  isValidConversationPage(): boolean {
    // 检查是否在对话页面
    return window.location.hostname.includes('tongyi.aliyun.com') &&
           document.querySelector(this.selectors.conversationContainer) !== null;
  }
  
  extractConversation(): Conversation | null {
    const conversationId = this.extractConversationId();
    if (!conversationId) return null;
    
    const messages = this.extractMessages();
    if (messages.length === 0) return null;
    
    return {
      id: conversationId,
      platform: this.platform,
      title: this.extractTitleFromPage(),
      url: window.location.href,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: messages,
      metadata: this.extractTongyiMetadata()
    };
  }
  
  private extractConversationId(): string {
    // 尝试从URL提取会话ID
    const urlMatch = window.location.href.match(/conversation[/-]([a-zA-Z0-9]+)/);
    if (urlMatch) return urlMatch[1];
    
    // 尝试从页面数据属性获取
    const conversationEl = document.querySelector('[data-conversation-id], [data-session-id]');
    if (conversationEl) {
      const id = conversationEl.getAttribute('data-conversation-id') || 
                 conversationEl.getAttribute('data-session-id');
      if (id) return id;
    }
    
    return this.generateTempId();
  }
  
  private extractTitleFromPage(): string {
    // 尝试从页面标题元素获取
    const titleEl = document.querySelector('.conversation-title, .chat-title, h1[class*="title"]');
    if (titleEl?.textContent) {
      return titleEl.textContent.trim();
    }
    
    // 从document.title提取
    if (document.title && !document.title.includes('通义千问')) {
      return document.title;
    }
    
    // 使用第一条用户消息
    const firstUserMsg = document.querySelector('.message-user .message-text');
    if (firstUserMsg?.textContent) {
      const text = firstUserMsg.textContent.trim();
      return text.length > 50 ? text.substring(0, 50) + '...' : text;
    }
    
    return '未命名对话';
  }
  
  private extractMessages(): Message[] {
    const messages: Message[] = [];
    const messageElements = document.querySelectorAll(this.selectors.conversationContainer);
    
    messageElements.forEach((element, index) => {
      const htmlElement = element as HTMLElement;
      
      // 判断消息角色
      const isUser = htmlElement.classList.contains('message-user') ||
                     htmlElement.querySelector('.message-user') !== null ||
                     htmlElement.getAttribute('data-role') === 'user';
      
      const contentEl = htmlElement.querySelector(this.selectors.messageContent) as HTMLElement ||
                       htmlElement.querySelector('.message-content') as HTMLElement;
      
      if (contentEl) {
        messages.push({
          id: `${this.extractConversationId()}-${index}`,
          role: isUser ? 'user' : 'assistant',
          content: this.cleanContent(contentEl.innerHTML),
          contentType: this.detectContentType(contentEl),
          timestamp: this.extractMessageTimestamp(htmlElement),
          metadata: this.extractMessageMetadata(htmlElement)
        });
      }
    });
    
    return messages;
  }
  
  private extractTongyiMetadata(): Record<string, any> {
    const metadata = this.extractMetadata();
    
    // 添加通义千问特定的元数据
    const modelEl = document.querySelector('[data-model], .model-info');
    if (modelEl?.textContent) {
      metadata.model = modelEl.textContent.trim();
    }
    
    // 检查是否有特殊功能标记（如插件、联网等）
    const features: string[] = [];
    if (document.querySelector('[data-plugin-enabled]')) {
      features.push('plugins');
    }
    if (document.querySelector('[data-web-search]')) {
      features.push('web-search');
    }
    
    if (features.length > 0) {
      metadata.features = features;
    }
    
    return metadata;
  }
}

// 初始化并启动监控
const extractor = new TongyiExtractor();

// 页面加载完成后开始监控
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    extractor.startMonitoring();
  });
} else {
  extractor.startMonitoring();
}

// 监听URL变化
let lastUrl = window.location.href;
const urlObserver = new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    
    extractor.stopMonitoring();
    setTimeout(() => {
      extractor.startMonitoring();
    }, 500);
  }
});

urlObserver.observe(document.body, {
  childList: true,
  subtree: true
});

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  extractor.stopMonitoring();
  urlObserver.disconnect();
});