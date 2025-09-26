from django.urls import path

from . import views

app_name = "chatbot"

urlpatterns = [
    path("send-message/", views.send_message, name="send_message"),
    path("conversations/", views.get_conversations, name="get_conversations"),
    path(
        "conversations/<int:conversation_id>/messages/",
        views.get_conversation_messages,
        name="get_conversation_messages",
    ),
    path(
        "conversations/<int:conversation_id>/delete/",
        views.delete_conversation,
        name="delete_conversation",
    ),
]
