/**
 * ConversationManager - Manages conversations between characters
 */

import type { Conversation, ConversationMessage, Position } from '../../types';
import { EventBus } from '../../events';

export class ConversationManager {
  private conversations: Map<string, Conversation> = new Map();
  private activeConversation: Conversation | null = null;
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Start a new conversation
   */
  start(participantIds: string[], location: Position): Conversation {
    const conversation: Conversation = {
      id: `conv-${Date.now()}`,
      participants: participantIds,
      messages: [],
      startTime: Date.now(),
      location,
    };

    this.conversations.set(conversation.id, conversation);
    this.activeConversation = conversation;

    this.eventBus.emit('conversation:started', {
      conversationId: conversation.id,
      participants: participantIds,
      location,
    });

    return conversation;
  }

  /**
   * Add a message to a conversation
   */
  addMessage(
    conversationId: string,
    speakerId: string,
    content: string
  ): ConversationMessage | null {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return null;

    const message: ConversationMessage = {
      speakerId,
      content,
      timestamp: Date.now(),
    };

    conversation.messages.push(message);

    this.eventBus.emit('conversation:message', {
      conversationId,
      message,
    });

    return message;
  }

  /**
   * End a conversation
   */
  end(conversationId: string): void {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return;

    conversation.endTime = Date.now();

    if (this.activeConversation?.id === conversationId) {
      this.activeConversation = null;
    }

    this.eventBus.emit('conversation:ended', {
      conversationId,
      participants: conversation.participants,
      messageCount: conversation.messages.length,
    });
  }

  /**
   * Get a conversation by ID
   */
  get(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  /**
   * Get active conversation
   */
  getActive(): Conversation | null {
    return this.activeConversation;
  }

  /**
   * Get all conversations
   */
  getAll(): Conversation[] {
    return Array.from(this.conversations.values());
  }

  /**
   * Get conversations involving a character
   */
  getByParticipant(characterId: string): Conversation[] {
    return this.getAll().filter((c) => c.participants.includes(characterId));
  }

  /**
   * Get active conversations (not ended)
   */
  getActiveConversations(): Conversation[] {
    return this.getAll().filter((c) => !c.endTime);
  }

  /**
   * Check if two characters are in an active conversation
   */
  areInConversation(characterId1: string, characterId2: string): boolean {
    return this.getActiveConversations().some(
      (c) =>
        c.participants.includes(characterId1) &&
        c.participants.includes(characterId2)
    );
  }

  /**
   * Get conversation between specific participants
   */
  getConversationBetween(
    characterId1: string,
    characterId2: string
  ): Conversation | undefined {
    return this.getActiveConversations().find(
      (c) =>
        c.participants.includes(characterId1) &&
        c.participants.includes(characterId2)
    );
  }

  /**
   * Format conversation for display
   */
  formatConversation(
    conversation: Conversation,
    characterNames: Record<string, string>
  ): string {
    return conversation.messages
      .map((m) => `${characterNames[m.speakerId] ?? 'Unknown'}: ${m.content}`)
      .join('\n');
  }

  /**
   * Check if conversation should naturally end
   */
  shouldEnd(conversationId: string): boolean {
    const conversation = this.get(conversationId);
    if (!conversation) return true;

    // Maximum turn limit
    if (conversation.messages.length >= 10) {
      return true;
    }

    // Check for farewell keywords in last message
    if (conversation.messages.length > 0) {
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      const farewellKeywords = [
        'goodbye', 'bye', 'see you', 'take care', 'gotta go',
        'have to go', 'need to go', 'later', 'farewell', 'nice talking',
      ];

      const lowerContent = lastMessage.content.toLowerCase();
      if (farewellKeywords.some((kw) => lowerContent.includes(kw))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Serialize conversations
   */
  serialize(): Conversation[] {
    return this.getAll();
  }

  /**
   * Deserialize and restore conversations
   */
  deserialize(data: Conversation[]): void {
    this.conversations.clear();
    this.activeConversation = null;

    data.forEach((conv) => {
      this.conversations.set(conv.id, conv);
      if (!conv.endTime) {
        this.activeConversation = conv;
      }
    });
  }

  /**
   * Clear all conversations
   */
  clear(): void {
    this.conversations.clear();
    this.activeConversation = null;
  }
}
