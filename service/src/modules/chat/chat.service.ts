import { ChatConversationsService } from './chat.conversations.service';
import { ChatMessagesService } from './chat.messages.service';
import { ChatInquiryService } from './chat.inquiry.service';

export class ChatService {
  static getOrCreateConversation = ChatConversationsService.getOrCreateConversation;
  static getMyConversations = ChatConversationsService.getMyConversations;
  
  static sendMessage = ChatMessagesService.sendMessage;
  static acceptOffer = ChatMessagesService.acceptOffer;
  static rejectOffer = ChatMessagesService.rejectOffer;
  static getMessages = ChatMessagesService.getMessages;
  
  static createDirectInquiry = ChatInquiryService.createDirectInquiry;
  static convertDirectInquiryToJob = ChatInquiryService.convertDirectInquiryToJob;
}
