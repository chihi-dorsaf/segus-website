from rest_framework import serializers
from .models import ChatConversation, ChatMessage, ChatbotKnowledge

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'message_type', 'content', 'timestamp', 'is_helpful']

class ChatConversationSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatConversation
        fields = ['id', 'title', 'created_at', 'updated_at', 'is_active', 'messages', 'message_count', 'last_message']

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            return {
                'content': last_msg.content[:100] + ('...' if len(last_msg.content) > 100 else ''),
                'timestamp': last_msg.timestamp,
                'message_type': last_msg.message_type
            }
        return None

class ChatbotKnowledgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatbotKnowledge
        fields = ['id', 'question_keywords', 'question_pattern', 'answer', 'category', 'is_active']
