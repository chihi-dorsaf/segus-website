import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatbotService, ChatMessage, ChatConversation, SendMessageResponse } from '../../services/chatbot.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  // État du chatbot
  isOpen = false;
  isMinimized = false;
  isLoading = false;
  isTyping = false;

  // Messages et conversations
  currentConversation: ChatConversation | null = null;
  messages: ChatMessage[] = [];
  conversations: ChatConversation[] = [];
  
  // Formulaire
  newMessage = '';
  
  // Suggestions
  quickQuestions: string[] = [];
  showSuggestions = true;
  
  // Subscriptions
  private subscriptions: Subscription[] = [];
  
  // Auto-scroll
  private shouldScrollToBottom = true;

  constructor(
    private chatbotService: ChatbotService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadQuickQuestions();
    this.loadConversations();
    
    // S'abonner aux changements de conversation
    const conversationSub = this.chatbotService.currentConversation$.subscribe(
      conversation => {
        this.currentConversation = conversation;
        if (conversation) {
          this.messages = [...conversation.messages];
          this.showSuggestions = this.messages.length === 0;
          this.scrollToBottom();
        } else {
          this.messages = [];
          this.showSuggestions = true;
        }
      }
    );
    this.subscriptions.push(conversationSub);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  /**
   * Basculer l'ouverture/fermeture du chatbot
   */
  toggleChatbot() {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.isMinimized) {
      this.isMinimized = false;
    }
    
    // Focus sur l'input quand on ouvre
    if (this.isOpen) {
      setTimeout(() => {
        if (this.messageInput) {
          this.messageInput.nativeElement.focus();
        }
      }, 100);
    }
  }

  /**
   * Minimiser/restaurer le chatbot
   */
  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
  }

  /**
   * Fermer le chatbot
   */
  closeChatbot() {
    this.isOpen = false;
    this.isMinimized = false;
  }

  /**
   * Charger les questions rapides
   */
  loadQuickQuestions() {
    this.quickQuestions = this.chatbotService.getContextualSuggestions(this.router.url);
  }

  /**
   * Charger les conversations existantes
   */
  loadConversations() {
    const sub = this.chatbotService.getConversations().subscribe({
      next: (conversations) => {
        this.conversations = conversations;
      },
      error: (error) => {
        console.warn('Conversations non disponibles (utilisateur non connecté):', error);
        // Ignorer l'erreur si l'utilisateur n'est pas connecté
        this.conversations = [];
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * Envoyer un message
   */
  sendMessage(messageText?: string) {
    const message = messageText || this.newMessage.trim();
    
    if (!message || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.showSuggestions = false;
    
    // Ajouter le message utilisateur immédiatement
    const userMessage: ChatMessage = {
      id: Date.now(),
      content: message,
      timestamp: new Date().toISOString(),
      message_type: 'user'
    };
    
    this.messages.push(userMessage);
    this.shouldScrollToBottom = true;
    this.newMessage = '';
    
    // Afficher l'indicateur de frappe
    this.isTyping = true;

    // Envoyer le message au backend
    const conversationId = this.currentConversation?.id;
    const sub = this.chatbotService.sendMessage(message, conversationId).subscribe({
      next: (response: SendMessageResponse) => {
        this.isTyping = false;
        this.isLoading = false;
        
        // Mettre à jour l'ID du message utilisateur avec la réponse du serveur
        const userMsgIndex = this.messages.findIndex(m => m.id === userMessage.id);
        if (userMsgIndex !== -1) {
          this.messages[userMsgIndex] = {
            ...this.messages[userMsgIndex],
            id: response.user_message.id
          };
        }
        
        // Ajouter la réponse du bot
        const botMessage: ChatMessage = {
          id: response.bot_response.id,
          content: response.bot_response.content,
          timestamp: response.bot_response.timestamp,
          message_type: 'bot'
        };
        
        this.messages.push(botMessage);
        this.shouldScrollToBottom = true;
        
        // Mettre à jour la conversation actuelle
        if (!this.currentConversation) {
          this.loadConversations(); // Recharger pour obtenir la nouvelle conversation
        }
      },
      error: (error) => {
        this.isTyping = false;
        this.isLoading = false;
        console.error('Erreur lors de l\'envoi du message:', error);
        
        // Ajouter un message d'erreur
        const errorMessage: ChatMessage = {
          id: Date.now() + 1,
          content: '❌ Désolé, une erreur s\'est produite. Veuillez réessayer.',
          timestamp: new Date().toISOString(),
          message_type: 'system'
        };
        
        this.messages.push(errorMessage);
        this.shouldScrollToBottom = true;
      }
    });
    
    this.subscriptions.push(sub);
  }

  /**
   * Envoyer une question prédéfinie
   */
  sendQuickQuestion(question: string) {
    this.sendMessage(question);
  }

  /**
   * Créer une nouvelle conversation
   */
  startNewConversation() {
    this.chatbotService.createNewConversation();
    this.messages = [];
    this.showSuggestions = true;
    this.loadQuickQuestions();
  }

  /**
   * Charger une conversation existante
   */
  loadConversation(conversation: ChatConversation) {
    this.chatbotService.setCurrentConversation(conversation);
  }

  /**
   * Supprimer une conversation
   */
  deleteConversation(conversation: ChatConversation, event: Event) {
    event.stopPropagation();
    
    if (confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
      const sub = this.chatbotService.deleteConversation(conversation.id).subscribe({
        next: () => {
          this.conversations = this.conversations.filter(c => c.id !== conversation.id);
          
          // Si c'est la conversation actuelle, en créer une nouvelle
          if (this.currentConversation?.id === conversation.id) {
            this.startNewConversation();
          }
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          alert('Erreur lors de la suppression de la conversation');
        }
      });
      
      this.subscriptions.push(sub);
    }
  }

  /**
   * Gérer la touche Entrée dans l'input
   */
  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Faire défiler vers le bas
   */
  private scrollToBottom() {
    if (this.messagesContainer) {
      setTimeout(() => {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }, 50);
    }
  }

  /**
   * Formater le contenu des messages (markdown basique)
   */
  formatMessageContent(content: string): string {
    return this.chatbotService.formatMessageContent(content);
  }

  /**
   * Obtenir la classe CSS pour le type de message
   */
  getMessageClass(messageType: string): string {
    switch (messageType) {
      case 'user':
        return 'message-user';
      case 'bot':
        return 'message-bot';
      case 'system':
        return 'message-system';
      default:
        return '';
    }
  }

  /**
   * Formater l'heure d'un message
   */
  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  /**
   * Obtenir le texte du placeholder pour l'input
   */
  getInputPlaceholder(): string {
    if (this.isLoading) {
      return 'Envoi en cours...';
    }
    return 'Tapez votre message...';
  }

  /**
   * Fonction de tracking pour ngFor des messages
   */
  trackByMessageId(index: number, message: ChatMessage): number {
    return message.id;
  }
}
