from django.urls import path
from .views import UserNotifications, UnreadCount, MarkRead, MarkAllRead, ProjectAssignment

urlpatterns = [
    path('user/<int:user_id>/', UserNotifications.as_view()),
    path('user/<int:user_id>/unread-count/', UnreadCount.as_view()),
    path('<int:pk>/read/', MarkRead.as_view()),
    path('user/<int:user_id>/mark-all-read/', MarkAllRead.as_view()),
    path('project-assignment/', ProjectAssignment.as_view()),
]




