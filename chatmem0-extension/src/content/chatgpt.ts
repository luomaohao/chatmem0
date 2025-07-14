import { BaseExtractor } from '../common/BaseExtractor';
import { Conversation, PlatformSelectors, Message, ContentType } from '../types';

class ChatGPTExtractor extends BaseExtractor {
  constructor() {
    super('ChatGPT');
  }
  
  getPlatformSelectors(): PlatformSelectors {
    return {
      conversationContainer: '[data-testid="conversation-turn"]',
      userMessage: '[data-message-author-role="user"]',
      assistantMessage: '[data-message-author-role="assistant"]',
      messageContent: '.prose',
      timestamp: 'time',
      conversationTitle: 'h1',
      conversationId: () => this.extractConversationId()
    };
  }
  
  isValidConversationPage(): boolean {
    return window.location.pathname.startsWith('/c/') && 
           document.querySelector(this.selectors.conversationContainer) !== null;
  }
  
  extractConversation(): Conversation | null {
    const conversationId = this.extractConversationId();
    if (!conversationId) return null;
    
    const title = this.extractTitle();
    const messages = this.extractMessages();
    
    if (messages.length === 0) return null;
    
    return {
      id: conversationId,
      platform: this.platform,
      title: title,
      url: window.location.href,
      createdAt: this.extractCreatedTime(),
      updatedAt: new Date().toISOString(),
      messages: messages,
      metadata: this.extractMetadata()
    };
  }
  
  private extractConversationId(): string {
    const match = window.location.pathname.match(/\/c\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : this.generateTempId();
  }
  
  private extractMessages(): Message[] {
    const messages: Message[] = [];
    const turns = document.querySelectorAll(this.selectors.conversationContainer);
    
    turns.forEach((turn, index) => {
      const element = turn as HTMLElement;
      const role = element.getAttribute('data-message-author-role');
      const contentEl = element.querySelector(this.selectors.messageContent) as HTMLElement;
      
      if (contentEl && role && (role === 'user' || role === 'assistant')) {
        messages.push({
          id: `${this.extractConversationId()}-${index}`,
          role: role as 'user' | 'assistant',
          content: this.cleanContent(contentEl.innerHTML),
          contentType: this.detectContentType(contentEl),
          timestamp: this.extractMessageTimestamp(element),
          metadata: this.extractMessageMetadata(element)
        });
      }
    });
    
    return messages;
  }
  
  protected extractCreatedTime(): string {
    // ChatGPT的对话创建时间可能在页面的某个元素中
    // 如果找不到，使用第一条消息的时间或当前时间
    const firstTurn = document.querySelector(this.selectors.conversationContainer);
    if (firstTurn) {
      const timestamp = this.extractMessageTimestamp(firstTurn as HTMLElement);
      if (timestamp) return timestamp;
    }
    
    return new Date().toISOString();
  }
  
  protected extractTitle(): string {
    // 优先从页面标题获取
    const titleEl = document.querySelector('h1');
    if (titleEl?.textContent) {
      return titleEl.textContent.trim();
    }
    
    // 其次从document.title提取
    const docTitle = document.title;
    if (docTitle && !docTitle.includes('ChatGPT')) {
      return docTitle;
    }
    
    // 最后使用第一条用户消息的前50个字符作为标题
    const firstUserMessage = document.querySelector('[data-message-author-role="user"] .prose');
    if (firstUserMessage?.textContent) {
      const text = firstUserMessage.textContent.trim();
      return text.length > 50 ? text.substring(0, 50) + '...' : text;
    }
    
    return '未命名对话';
  }
}

// 初始化并启动监控
const extractor = new ChatGPTExtractor();

// 页面加载完成后开始监控
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    extractor.startMonitoring();
  });
} else {
  extractor.startMonitoring();
}

// 监听URL变化（ChatGPT使用单页应用）
let lastUrl = window.location.href;
const urlObserver = new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    
    // URL变化时重新检查并启动监控
    extractor.stopMonitoring();
    setTimeout(() => {
      extractor.startMonitoring();
    }, 500); // 给页面一些时间加载新内容
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