import { Conversation, PlatformSelectors, Message, ChromeMessage } from '../types';
import { debounce, generateId, cleanHtmlContent, detectContentType } from './utils';

export abstract class BaseExtractor {
  protected platform: string;
  protected selectors: PlatformSelectors;
  protected observer: MutationObserver | null = null;
  
  constructor(platform: string) {
    this.platform = platform;
    this.selectors = this.getPlatformSelectors();
    this.initObserver();
  }
  
  // 抽象方法，子类必须实现
  abstract getPlatformSelectors(): PlatformSelectors;
  abstract extractConversation(): Conversation | null;
  abstract isValidConversationPage(): boolean;
  
  // 通用方法
  startMonitoring(): void {
    // 总是启动监控，避免因初始DOM未渲染而错过对话
    // 是否有效由提取阶段决定
    console.log(`[${this.platform}] Starting monitoring`);
    
    if (this.observer) {
      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
    
    // 立即尝试提取一次（如果DOM未就绪会安全返回）
    this.debounceExtraction();
  }
  
  stopMonitoring(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    console.log(`[${this.platform}] Stopped monitoring`);
  }
  
  protected initObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });
  }
  
  protected handleMutations(mutations: MutationRecord[]): void {
    let hasNewContent = false;
    
    mutations.forEach(mutation => {
      if (this.isRelevantMutation(mutation)) {
        hasNewContent = true;
      }
    });
    
    if (hasNewContent) {
      this.debounceExtraction();
    }
  }
  
  protected isRelevantMutation(mutation: MutationRecord): boolean {
    // 检查是否是相关的DOM变化
    if (mutation.type === 'childList') {
      // 检查是否有新的消息节点
      const addedNodes = Array.from(mutation.addedNodes);
      return addedNodes.some(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          return element.matches(this.selectors.conversationContainer) ||
                 element.querySelector(this.selectors.conversationContainer) !== null;
        }
        return false;
      });
    }
    
    if (mutation.type === 'characterData') {
      // 检查文本内容变化
      const parent = mutation.target.parentElement;
      if (parent) {
        return parent.closest(this.selectors.conversationContainer) !== null;
      }
    }
    
    return false;
  }
  
  protected debounceExtraction = debounce(() => {
    try {
      const conversation = this.extractConversation();
      if (conversation) {
        this.sendToBackground(conversation);
      }
    } catch (error) {
      console.error(`[${this.platform}] Error extracting conversation:`, error);
    }
  }, 1000);
  
  protected sendToBackground(conversation: Conversation): void {
    const message: ChromeMessage = {
      type: 'NEW_CONVERSATION',
      conversation: conversation
    };
    
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        console.error(`[${this.platform}] Error sending message:`, chrome.runtime.lastError);
      } else {
        console.log(`[${this.platform}] Conversation sent successfully`);
      }
    });
  }
  
  // 辅助方法
  protected generateTempId(): string {
    return `${this.platform.toLowerCase()}-${generateId()}`;
  }
  
  protected cleanContent(html: string): string {
    return cleanHtmlContent(html);
  }
  
  protected detectContentType(element: HTMLElement): 'text' | 'code' | 'image' | 'mixed' {
    return detectContentType(element);
  }
  
  protected extractMessageTimestamp(element: HTMLElement): string {
    if (this.selectors.timestamp) {
      const timestampEl = element.querySelector(this.selectors.timestamp);
      if (timestampEl) {
        return timestampEl.getAttribute('datetime') || 
               timestampEl.textContent || 
               new Date().toISOString();
      }
    }
    return new Date().toISOString();
  }
  
  protected extractTitle(): string {
    const titleSelector = this.selectors.conversationTitle;
    
    if (typeof titleSelector === 'function') {
      return titleSelector();
    }
    
    const titleEl = document.querySelector(titleSelector);
    return titleEl?.textContent?.trim() || '未命名对话';
  }
  
  protected extractCreatedTime(): string {
    // 尝试从URL或页面元素中提取创建时间
    // 如果无法获取，返回当前时间
    return new Date().toISOString();
  }
  
  protected extractMetadata(): Record<string, any> {
    return {
      extractedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  }
  
  protected extractMessageMetadata(element: HTMLElement): Record<string, any> {
    const metadata: Record<string, any> = {};
    
    // 提取消息的其他属性
    const attributes = element.attributes;
    for (let i = 0; i < attributes.length; i++) {
      const attr = attributes[i];
      if (attr.name.startsWith('data-')) {
        metadata[attr.name] = attr.value;
      }
    }
    
    return metadata;
  }
}