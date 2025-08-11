import { BaseExtractor } from '../common/BaseExtractor';
import { Conversation, PlatformSelectors, Message } from '../types';

class ChatGPTExtractor extends BaseExtractor {
  constructor() {
    super('ChatGPT');
  }
  
  getPlatformSelectors(): PlatformSelectors {
    return {
      // 兼容多版本结构：新旧data属性、role容器、可视消息块
      conversationContainer: '[data-testid="conversation-turn"], [data-message-author-role], [data-testid="chat-message"]',
      userMessage: '[data-message-author-role="user"]',
      assistantMessage: '[data-message-author-role="assistant"]',
      // 内容容器的多候选
      messageContent: '.prose, [data-message-content], .markdown, .msg-content, .whitespace-pre-wrap',
      timestamp: 'time',
      conversationTitle: 'h1, header h1, [data-testid="conversation-title"]',
      conversationId: () => this.extractConversationId()
    };
  }
  
  isValidConversationPage(): boolean {
    // 仅依赖于对话容器是否存在，兼容不同域名/路径
    return document.querySelector(this.selectors.conversationContainer) !== null;
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
    // URL中的会话ID（兼容 c/ 或 chat/）
    const pathMatch = window.location.pathname.match(/\/(?:c|chat)\/([a-zA-Z0-9-]+)/);
    if (pathMatch && pathMatch[1]) return pathMatch[1];
    // DOM数据属性
    const el = document.querySelector('[data-conversation-id], [data-thread-id], [data-testid="conversation"]');
    const id = el?.getAttribute('data-conversation-id') || el?.getAttribute('data-thread-id');
    if (id) return id;
    // 回退
    return this.generateTempId();
  }
  
  private extractMessages(): Message[] {
    const messages: Message[] = [];
    const turns = document.querySelectorAll(this.selectors.conversationContainer);
    
    turns.forEach((turn, index) => {
      const element = turn as HTMLElement;
      // Some pages place the author role on a descendant rather than the container itself
      const authorElement = element.matches('[data-message-author-role]')
        ? element
        : (element.querySelector('[data-message-author-role]') as HTMLElement | null);
      const role = authorElement?.getAttribute('data-message-author-role');
      const contentEl = (authorElement?.querySelector(this.selectors.messageContent) ||
        element.querySelector(this.selectors.messageContent)) as HTMLElement | null;
      
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
    const firstUserMessage = document.querySelector('[data-message-author-role="user"] .prose, [data-message-author-role="user"] [data-message-content]');
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

const startUrlObserver = () => {
  if (!document.body) return;
  urlObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startUrlObserver);
} else {
  startUrlObserver();
}

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  extractor.stopMonitoring();
  urlObserver.disconnect();
});