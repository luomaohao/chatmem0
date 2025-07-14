import { Conversation, ProcessedConversation, Message } from '../types';
import { cleanHtmlContent } from '../common/utils';

interface DataProcessor {
  cleanConversation(conversation: Conversation): Promise<Conversation>;
  enhanceContent(conversation: Conversation): Promise<Conversation>;
  extractAdvancedMetadata(conversation: Conversation): Promise<ProcessedConversation>;
}

export class DataProcessingEngine {
  private processors: Map<string, DataProcessor> = new Map();
  
  constructor() {
    this.initProcessors();
  }
  
  private initProcessors(): void {
    this.processors.set('ChatGPT', new ChatGPTProcessor());
    this.processors.set('Claude', new ClaudeProcessor());
    this.processors.set('文心一言', new YiyanProcessor());
    this.processors.set('通义千问', new TongyiProcessor());
  }
  
  async processConversation(conversation: Conversation): Promise<ProcessedConversation> {
    const processor = this.processors.get(conversation.platform);
    if (!processor) {
      // 使用默认处理器
      console.warn(`[DataProcessingEngine] No processor for platform: ${conversation.platform}, using default`);
      return await this.defaultProcess(conversation);
    }
    
    // 数据清洗和标准化
    const cleaned = await processor.cleanConversation(conversation);
    
    // 内容增强
    const enhanced = await processor.enhanceContent(cleaned);
    
    // 元数据提取
    const withMetadata = await processor.extractAdvancedMetadata(enhanced);
    
    return withMetadata;
  }
  
  private async defaultProcess(conversation: Conversation): Promise<ProcessedConversation> {
    return {
      ...conversation,
      processed: true,
      processedAt: new Date().toISOString()
    };
  }
}

// 基础处理器类
abstract class BaseProcessor implements DataProcessor {
  async cleanConversation(conversation: Conversation): Promise<Conversation> {
    const cleanedMessages = conversation.messages.map(msg => ({
      ...msg,
      content: this.cleanMessageContent(msg.content)
    }));
    
    return {
      ...conversation,
      messages: cleanedMessages
    };
  }
  
  async enhanceContent(conversation: Conversation): Promise<Conversation> {
    // 默认实现：不做增强
    return conversation;
  }
  
  async extractAdvancedMetadata(conversation: Conversation): Promise<ProcessedConversation> {
    const metadata = {
      messageCount: conversation.messages.length,
      userMessageCount: conversation.messages.filter(m => m.role === 'user').length,
      assistantMessageCount: conversation.messages.filter(m => m.role === 'assistant').length,
      hasCode: conversation.messages.some(m => m.contentType === 'code'),
      hasImages: conversation.messages.some(m => m.contentType === 'image'),
      estimatedTokens: this.estimateTokens(conversation),
      ...conversation.metadata
    };
    
    return {
      ...conversation,
      processed: true,
      processedAt: new Date().toISOString(),
      metadata: metadata,
      tags: await this.extractTags(conversation),
      summary: await this.generateSummary(conversation)
    };
  }
  
  protected cleanMessageContent(content: string): string {
    // 基本清理：移除多余空白、规范化换行等
    return content
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
  
  protected estimateTokens(conversation: Conversation): number {
    // 简单的token估算（每4个字符约1个token）
    const totalChars = conversation.messages.reduce((sum, msg) => 
      sum + msg.content.length, 0
    );
    return Math.ceil(totalChars / 4);
  }
  
  protected async extractTags(conversation: Conversation): Promise<string[]> {
    const tags: Set<string> = new Set();
    
    // 从内容中提取关键词作为标签
    conversation.messages.forEach(msg => {
      // 检测编程语言
      const codeBlocks = msg.content.match(/```(\w+)/g);
      if (codeBlocks) {
        codeBlocks.forEach(block => {
          const lang = block.replace('```', '').toLowerCase();
          if (lang && lang.length < 20) {
            tags.add(lang);
          }
        });
      }
      
      // 检测常见主题
      const themes = ['debug', 'error', 'help', 'explain', 'how to', 'tutorial'];
      themes.forEach(theme => {
        if (msg.content.toLowerCase().includes(theme)) {
          tags.add(theme);
        }
      });
    });
    
    return Array.from(tags);
  }
  
  protected async generateSummary(conversation: Conversation): Promise<string> {
    // 使用第一条用户消息作为摘要
    const firstUserMessage = conversation.messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      const summary = firstUserMessage.content
        .replace(/```[\s\S]*?```/g, '[代码块]')
        .replace(/\n+/g, ' ')
        .substring(0, 200);
      return summary.length < firstUserMessage.content.length ? summary + '...' : summary;
    }
    
    return conversation.title;
  }
}

// ChatGPT处理器
class ChatGPTProcessor extends BaseProcessor {
  async enhanceContent(conversation: Conversation): Promise<Conversation> {
    // ChatGPT特定的内容增强
    const enhancedMessages = conversation.messages.map(msg => {
      if (msg.contentType === 'code' || msg.content.includes('```')) {
        // 增强代码块的处理
        return {
          ...msg,
          content: this.enhanceCodeBlocks(msg.content)
        };
      }
      return msg;
    });
    
    return {
      ...conversation,
      messages: enhancedMessages
    };
  }
  
  private enhanceCodeBlocks(content: string): string {
    // 确保代码块格式正确
    return content.replace(/```(\w*)\n/g, (match, lang) => {
      return `\`\`\`${lang || 'plaintext'}\n`;
    });
  }
}

// Claude处理器
class ClaudeProcessor extends BaseProcessor {
  async extractAdvancedMetadata(conversation: Conversation): Promise<ProcessedConversation> {
    const baseResult = await super.extractAdvancedMetadata(conversation);
    
    // Claude特定的元数据
    const claudeMetadata = {
      ...baseResult.metadata,
      hasArtifacts: conversation.messages.some(m => 
        m.content.includes('<artifact') || m.content.includes('artifact')
      )
    };
    
    return {
      ...baseResult,
      metadata: claudeMetadata
    };
  }
}

// 文心一言处理器
class YiyanProcessor extends BaseProcessor {
  protected cleanMessageContent(content: string): string {
    // 文心一言可能有特殊的格式需要清理
    let cleaned = super.cleanMessageContent(content);
    
    // 移除可能的特殊标记
    cleaned = cleaned.replace(/\[图片\]/g, '[图片]');
    cleaned = cleaned.replace(/\[语音\]/g, '[语音]');
    
    return cleaned;
  }
}

// 通义千问处理器
class TongyiProcessor extends BaseProcessor {
  async extractAdvancedMetadata(conversation: Conversation): Promise<ProcessedConversation> {
    const baseResult = await super.extractAdvancedMetadata(conversation);
    
    // 通义千问特定的元数据
    const tongyiMetadata = {
      ...baseResult.metadata,
      hasWebSearch: conversation.metadata?.features?.includes('web-search') || false,
      hasPlugins: conversation.metadata?.features?.includes('plugins') || false
    };
    
    return {
      ...baseResult,
      metadata: tongyiMetadata
    };
  }
}