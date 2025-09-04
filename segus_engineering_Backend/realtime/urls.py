from django.urls import path
from . import views

urlpatterns = [
    path('sse/work-sessions/', views.WorkSessionSSEView.as_view(), name='work_sessions_sse'),
    path('notify-session/', views.notify_session_event, name='notify_session_event'),
]
