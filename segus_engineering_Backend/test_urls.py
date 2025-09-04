#!/usr/bin/env python
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'segus_engineering_Backend.settings')
django.setup()

from django.urls import reverse
from django.test import Client
from rest_framework.test import APIClient

def test_urls():
    """Test URL patterns"""
    print("🔍 Testing URL patterns...")
    
    # Test basic URL resolution
    try:
        from employees.views import EmployeeViewSet
        print("✅ EmployeeViewSet imported successfully")
        
        # Check if the viewset has the stats action
        actions = EmployeeViewSet.get_extra_actions()
        print(f"📋 Available actions: {[action.url_path for action in actions]}")
        
        # Test URL patterns
        from django.urls import get_resolver
        resolver = get_resolver()
        url_patterns = resolver.url_patterns
        
        print("🌐 URL patterns:")
        for pattern in url_patterns:
            if hasattr(pattern, 'url_patterns'):
                for sub_pattern in pattern.url_patterns:
                    print(f"  - {sub_pattern.pattern}")
            else:
                print(f"  - {pattern.pattern}")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_urls() 