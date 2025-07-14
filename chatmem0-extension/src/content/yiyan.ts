import { BaseExtractor } from '../common/BaseExtractor';
import { Conversation, PlatformSelectors, Message } from '../types';

class YiyanExtractor extends BaseExtractor {
  constructor() {
    super('文心一言');
  }
  
  getPlatformSelectors(): PlatformSelectors {
    return {
      // 文心一言的选择器可能需要根据实际页面结构调整
      conversationContainer: '.chat-message',
      userMessage: '.user-message',
      assistantMessage: '.assistant-message',
      messageContent: '.message-content',
      conversationTitle: () => this.extractTitleFromPage(),
      conversationId: () => this.extractConversationId()
    };
  }
  
  isValidConversationPage(): boolean {
    // 检查是否在对话页面
    return window.location.hostname.includes('yiyan.baidu.com') &&
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
      metadata: this.extractYiyanMetadata()
    };
  }
  
  private extractConversationId(): string {
    // 尝试从URL或页面元素中提取会话ID
    const urlMatch = window.location.pathname.match(/\/chat\/([a-zA-Z0-9]+)/);
    if (urlMatch) return urlMatch[1];
    
    // 尝试从页面元素获取
    const idElement = document.querySelector('[data-conversation-id]');
    if (idElement) {
      return idElement.getAttribute('data-conversation-id') || this.generateTempId();
    }
    
    return this.generateTempId();
  }
  
  private extractTitleFromPage(): string {
    // 尝试多种方式获取标题
    const titleElement = document.querySelector('.conversation-title, h1, h2');
    if (titleElement?.textContent) {
      return titleElement.textContent.trim();
    }
    
    // 从第一条用户消息提取
    const firstUserMessage = document.querySelector('.user-message .message-content');
    if (firstUserMessage?.textContent) {
      const text = firstUserMessage.textContent.trim();
      return text.length > 50 ? text.substring(0, 50) + '...' : text;
    }
    
    return '未命名对话';
  }
  
  private extractMessages(): Message[] {
    const messages: Message[] = [];
    const messageElements = document.querySelectorAll(this.selectors.conversationContainer);
    
    messageElements.forEach((element, index) => {
      const htmlElement = element as HTMLElement;
      const isUser = htmlElement.classList.contains('user-message') || 
                     htmlElement.querySelector('.user-message') !== null;
      const contentEl = htmlElement.querySelector(this.selectors.messageContent) as HTMLElement;
      
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
  
  private extractYiyanMetadata(): Record<string, any> {
    const metadata = this.extractMetadata();
    
    // 添加文心一言特定的元数据
    const modelInfo = document.querySelector('[data-model-info]');
    if (modelInfo?.textContent) {
      metadata.model = modelInfo.textContent.trim();
    }
    
    return metadata;
  }
}

// 初始化并启动监控
const extractor = new YiyanExtractor();

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