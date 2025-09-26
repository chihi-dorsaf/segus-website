from django.contrib import admin

from .models import ChatbotKnowledge, ChatConversation, ChatMessage


@admin.register(ChatConversation)
class ChatConversationAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "title", "created_at", "updated_at", "is_active"]
    list_filter = ["is_active", "created_at"]
    search_fields = ["user__username", "title"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "conversation",
        "message_type",
        "content_preview",
        "timestamp",
    ]
    list_filter = ["message_type", "timestamp"]
    search_fields = ["content", "conversation__user__username"]
    readonly_fields = ["timestamp"]

    def content_preview(self, obj):
        return obj.content[:50] + ("..." if len(obj.content) > 50 else "")

    content_preview.short_description = "Content Preview"


@admin.register(ChatbotKnowledge)
class ChatbotKnowledgeAdmin(admin.ModelAdmin):
    list_display = ["id", "category", "question_pattern", "is_active", "created_at"]
    list_filter = ["category", "is_active", "created_at"]
    search_fields = ["question_pattern", "question_keywords", "answer"]
    readonly_fields = ["created_at"]
