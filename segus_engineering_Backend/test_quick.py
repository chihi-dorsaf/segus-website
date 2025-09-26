#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'segus_engineering_Backend.settings')
django.setup()

from employees.models import Employee
from employees.serializers import EmployeeSerializer
from users.models import User

# Test the EmployeeSerializer directly
try:
    # Get an existing employee
    employee = Employee.objects.first()
    if employee:
        serializer = EmployeeSerializer(employee)
        data = serializer.data
        print("EmployeeSerializer data:")
        print(f"Keys: {list(data.keys())}")
        print(f"Position in data: {'position' in data}")
        if 'position' in data:
            print(f"Position value: {data['position']}")
        else:
            print("Position field is missing!")
            print(f"Full data: {data}")
    else:
        print("No employee found in database")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
