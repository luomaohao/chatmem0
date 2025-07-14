import { BaseExtractor } from '../common/BaseExtractor';
import { Conversation, PlatformSelectors, Message } from '../types';

class ClaudeExtractor extends BaseExtractor {
  constructor() {
    super('Claude');
  }
  
  getPlatformSelectors(): PlatformSelectors {
    return {
      conversationContainer: '[data-testid="message"]',
      userMessage: '[data-author="human"]',
      assistantMessage: '[data-author="assistant"]',
      messageContent: '.font-claude-message',
      conversationTitle: () => this.extractTitleFromUrl(),
      conversationId: () => this.extractConversationId()
    };
  }
  
  isValidConversationPage(): boolean {
    return window.location.pathname.startsWith('/chat/') &&
           document.querySelector(this.selectors.conversationContainer) !== null;
  }
  
  extractConversation(): Conversation | null {
    const conversationId = this.extractConversationId();
    if (!conversationId) return null;
    
    const messages = this.extractMessagesFromClaude();
    if (messages.length === 0) return null;
    
    return {
      id: conversationId,
      platform: this.platform,
      title: this.extractTitleFromUrl(),
      url: window.location.href,
      createdAt: this.estimateCreatedTime(),
      updatedAt: new Date().toISOString(),
      messages: messages,
      metadata: this.extractClaudeMetadata()
    };
  }
  
  private extractConversationId(): string {
    const match = window.location.pathname.match(/\/chat\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : this.generateTempId();
  }
  
  private extractTitleFromUrl(): string {
    // Claude可能在URL或页面某处显示标题
    // 首先尝试从document.title获取
    const docTitle = document.title;
    if (docTitle && !docTitle.toLowerCase().includes('claude')) {
      return docTitle;
    }
    
    // 尝试从页面中查找标题元素
    const titleEl = document.querySelector('h1, h2');
    if (titleEl?.textContent) {
      const title = titleEl.textContent.trim();
      if (title && !title.toLowerCase().includes('claude')) {
        return title;
      }
    }
    
    // 使用第一条用户消息作为标题
    const firstUserMessage = document.querySelector('[data-author="human"] .font-claude-message');
    if (firstUserMessage?.textContent) {
      const text = firstUserMessage.textContent.trim();
      return text.length > 50 ? text.substring(0, 50) + '...' : text;
    }
    
    return '未命名对话';
  }
  
  private extractMessagesFromClaude(): Message[] {
    const messages: Message[] = [];
    const messageElements = document.querySelectorAll(this.selectors.conversationContainer);
    
    messageElements.forEach((element, index) => {
      const htmlElement = element as HTMLElement;
      const author = htmlElement.getAttribute('data-author');
      const contentEl = htmlElement.querySelector(this.selectors.messageContent) as HTMLElement;
      
      if (contentEl && author) {
        messages.push({
          id: `${this.extractConversationId()}-${index}`,
          role: author === 'human' ? 'user' : 'assistant',
          content: this.cleanContent(contentEl.innerHTML),
          contentType: this.detectContentType(contentEl),
          timestamp: new Date().toISOString(), // Claude通常不显示时间戳
          metadata: this.extractMessageMetadata(htmlElement)
        });
      }
    });
    
    return messages;
  }
  
  private estimateCreatedTime(): string {
    // Claude可能不提供创建时间，估算为第一条消息的时间
    return new Date().toISOString();
  }
  
  private extractClaudeMetadata(): Record<string, any> {
    const metadata = this.extractMetadata();
    
    // 添加Claude特定的元数据
    const modelIndicator = document.querySelector('[data-testid="model-selector"]');
    if (modelIndicator?.textContent) {
      metadata.model = modelIndicator.textContent.trim();
    }
    
    return metadata;
  }
}

// 初始化并启动监控
const extractor = new ClaudeExtractor();

// 页面加载完成后开始监控
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    extractor.startMonitoring();
  });
} else {
  extractor.startMonitoring();
}

// 监听URL变化（Claude也是单页应用）
let lastUrl = window.location.href;
const urlObserver = new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    
    // URL变化时重新检查并启动监控
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