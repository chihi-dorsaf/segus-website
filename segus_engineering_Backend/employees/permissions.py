# employees/permissions.py
from rest_framework import permissions

class IsAdminRole(permissions.BasePermission):
    """
    Permission personnalisée pour les administrateurs
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Vérifiez si l'utilisateur a le rôle ADMIN
        return hasattr(request.user, 'role') and request.user.role == 'ADMIN'
    
    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)