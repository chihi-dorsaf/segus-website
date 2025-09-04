# projects/serializers.py

from rest_framework import serializers
from .models import Project, Task, SubTask
from django.contrib.auth import get_user_model
User = get_user_model()

class UserSimpleSerializer(serializers.ModelSerializer):
    """Serializer simple pour les utilisateurs dans les relations"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class SubTaskSerializer(serializers.ModelSerializer):
    assigned_employees = UserSimpleSerializer(many=True, read_only=True)
    assigned_employee_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    created_by = UserSimpleSerializer(read_only=True)
    
    class Meta:
        model = SubTask
        fields = [
            'id', 'section_name', 'section_number', 'section_id', 'kilometrage',
            'is_completed', 'completed_at', 'task', 'assigned_employees',
            'assigned_employee_ids', 'created_by', 'created_at', 'updated_at'
        ]
    
    def create(self, validated_data):
        assigned_employee_ids = validated_data.pop('assigned_employee_ids', [])
        subtask = SubTask.objects.create(**validated_data)
        
        if assigned_employee_ids:
            # Convertir les IDs d'employés en IDs d'utilisateurs
            from employees.models import Employee
            employee_objects = Employee.objects.filter(id__in=assigned_employee_ids)
            user_ids = [emp.user.id for emp in employee_objects]
            employees = User.objects.filter(id__in=user_ids, role='EMPLOYE')
            subtask.assigned_employees.set(employees)
        
        return subtask
    
    def update(self, instance, validated_data):
        assigned_employee_ids = validated_data.pop('assigned_employee_ids', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if assigned_employee_ids is not None:
            # Convertir les IDs d'employés en IDs d'utilisateurs
            from employees.models import Employee
            employee_objects = Employee.objects.filter(id__in=assigned_employee_ids)
            user_ids = [emp.user.id for emp in employee_objects]
            print(f"DEBUG UPDATE: Converting employee IDs {assigned_employee_ids} to user IDs {user_ids}")
            
            employees = User.objects.filter(id__in=user_ids, role='EMPLOYE')
            print(f"DEBUG UPDATE: Found {employees.count()} users with role EMPLOYE for update")
            instance.assigned_employees.set(employees)
        
        return instance


class TaskSerializer(serializers.ModelSerializer):
    assigned_employees = UserSimpleSerializer(many=True, read_only=True)
    assigned_employee_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    created_by = UserSimpleSerializer(read_only=True)
    subtasks = SubTaskSerializer(many=True, read_only=True)
    
    # Champs calculés
    progress_percentage = serializers.ReadOnlyField()
    total_subtasks = serializers.ReadOnlyField()
    completed_subtasks = serializers.ReadOnlyField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status', 'priority', 'start_date', 'end_date',
            'project', 'assigned_employees', 'assigned_employee_ids', 'created_by',
            'subtasks', 'progress_percentage', 'total_subtasks', 'completed_subtasks',
            'created_at', 'updated_at'
        ]
    
    def create(self, validated_data):
        assigned_employee_ids = validated_data.pop('assigned_employee_ids', [])
        task = Task.objects.create(**validated_data)
        
        if assigned_employee_ids:
            # Convertir les IDs d'employés en IDs d'utilisateurs
            from employees.models import Employee
            employee_objects = Employee.objects.filter(id__in=assigned_employee_ids)
            user_ids = [emp.user.id for emp in employee_objects]
            employees = User.objects.filter(id__in=user_ids, role='EMPLOYE')
            task.assigned_employees.set(employees)
        
        return task
    
    def update(self, instance, validated_data):
        assigned_employee_ids = validated_data.pop('assigned_employee_ids', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if assigned_employee_ids is not None:
            # Convertir les IDs d'employés en IDs d'utilisateurs
            from employees.models import Employee
            employee_objects = Employee.objects.filter(id__in=assigned_employee_ids)
            user_ids = [emp.user.id for emp in employee_objects]
            employees = User.objects.filter(id__in=user_ids, role='EMPLOYE')
            instance.assigned_employees.set(employees)
        
        return instance


class TaskSimpleSerializer(serializers.ModelSerializer):
    """Serializer simple pour les tâches dans les relations"""
    progress_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Task
        fields = ['id', 'title', 'status', 'priority', 'progress_percentage', 'start_date', 'end_date']


class ProjectSerializer(serializers.ModelSerializer):
    assigned_employees = UserSimpleSerializer(many=True, read_only=True)
    assigned_employee_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    created_by = UserSimpleSerializer(read_only=True)
    tasks = TaskSimpleSerializer(many=True, read_only=True)
    
    # Champs calculés
    progress_percentage = serializers.ReadOnlyField()
    total_tasks = serializers.ReadOnlyField()
    completed_tasks = serializers.ReadOnlyField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'status', 'start_date', 'end_date',
            'assigned_employees', 'assigned_employee_ids', 'created_by', 'tasks',
            'progress_percentage', 'total_tasks', 'completed_tasks',
            'created_at', 'updated_at'
        ]
    
    def create(self, validated_data):
        print(f"DEBUG: Raw validated_data received: {validated_data}")
        assigned_employee_ids = validated_data.pop('assigned_employee_ids', [])
        print(f"DEBUG: Extracted assigned_employee_ids: {assigned_employee_ids}")
        
        project = Project.objects.create(**validated_data)
        print(f"DEBUG: Project created with ID: {project.id}")
        
        if assigned_employee_ids:
            print(f"DEBUG: Assigning employees with IDs: {assigned_employee_ids}")
            # Vérifier tous les utilisateurs avec ces IDs
            all_users = User.objects.filter(id__in=assigned_employee_ids)
            print(f"DEBUG: All users found with these IDs: {all_users.count()} users")
            if all_users.count() == 0:
                print(f"DEBUG: AUCUN utilisateur trouvé avec les IDs: {assigned_employee_ids}")
                print("DEBUG: Vérification de tous les utilisateurs existants:")
                all_existing_users = User.objects.all()
                for user in all_existing_users:
                    print(f"DEBUG: Existing User ID={user.id}, username={user.username}, email={user.email}, role={user.role}")
            else:
                for user in all_users:
                    print(f"DEBUG: User ID={user.id}, username={user.username}, email={user.email}, role={user.role}")
            
            # Convertir les IDs d'employés en IDs d'utilisateurs
            from employees.models import Employee
            employee_objects = Employee.objects.filter(id__in=assigned_employee_ids)
            user_ids = [emp.user.id for emp in employee_objects]
            print(f"DEBUG: Converting employee IDs {assigned_employee_ids} to user IDs {user_ids}")
            
            # Filtrer seulement les employés avec rôle EMPLOYE
            employees = User.objects.filter(id__in=user_ids, role='EMPLOYE')
            print(f"DEBUG: Found {employees.count()} users with role EMPLOYE to assign")
            for emp in employees:
                print(f"DEBUG: User to assign: ID={emp.id}, username={emp.username}, role={emp.role}")
            project.assigned_employees.set(employees)
            print(f"DEBUG: Successfully assigned {project.assigned_employees.count()} employees")
        else:
            print("DEBUG: No assigned_employee_ids provided - no employees will be assigned")
        
        return project
    
    def update(self, instance, validated_data):
        assigned_employee_ids = validated_data.pop('assigned_employee_ids', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if assigned_employee_ids is not None:
            # Convertir les IDs d'employés en IDs d'utilisateurs
            from employees.models import Employee
            employee_objects = Employee.objects.filter(id__in=assigned_employee_ids)
            user_ids = [emp.user.id for emp in employee_objects]
            employees = User.objects.filter(id__in=user_ids, role='EMPLOYE')
            instance.assigned_employees.set(employees)
        
        return instance


class ProjectDetailSerializer(ProjectSerializer):
    """Serializer détaillé pour un projet avec toutes ses tâches"""
    tasks = TaskSerializer(many=True, read_only=True)
    
    class Meta(ProjectSerializer.Meta):
        pass


# Serializers pour la création et mise à jour
class ProjectCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création de projets"""
    assigned_employee_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Project
        fields = [
            'title', 'description', 'status', 'start_date', 'end_date',
            'assigned_employee_ids'
        ]
    
    def create(self, validated_data):
        assigned_employee_ids = validated_data.pop('assigned_employee_ids', [])
        project = Project.objects.create(**validated_data)
        
        if assigned_employee_ids:
            from employees.models import Employee
            employee_objects = Employee.objects.filter(id__in=assigned_employee_ids)
            user_ids = [emp.user.id for emp in employee_objects]
            employees = User.objects.filter(id__in=user_ids, role='EMPLOYE')
            project.assigned_employees.set(employees)
        
        return project


class ProjectUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour de projets"""
    assigned_employee_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Project
        fields = [
            'title', 'description', 'status', 'start_date', 'end_date',
            'assigned_employee_ids'
        ]
    
    def update(self, instance, validated_data):
        assigned_employee_ids = validated_data.pop('assigned_employee_ids', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if assigned_employee_ids is not None:
            from employees.models import Employee
            employee_objects = Employee.objects.filter(id__in=assigned_employee_ids)
            user_ids = [emp.user.id for emp in employee_objects]
            employees = User.objects.filter(id__in=user_ids, role='EMPLOYE')
            instance.assigned_employees.set(employees)
        
        return instance


class TaskCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création de tâches"""
    assigned_employee_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Task
        fields = [
            'title', 'description', 'status', 'priority', 'start_date', 'end_date',
            'project', 'assigned_employee_ids'
        ]
    
    def create(self, validated_data):
        assigned_employee_ids = validated_data.pop('assigned_employee_ids', [])
        task = Task.objects.create(**validated_data)
        
        if assigned_employee_ids:
            from employees.models import Employee
            employee_objects = Employee.objects.filter(id__in=assigned_employee_ids)
            user_ids = [emp.user.id for emp in employee_objects]
            employees = User.objects.filter(id__in=user_ids, role='EMPLOYE')
            task.assigned_employees.set(employees)
        
        return task


class TaskUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour de tâches"""
    assigned_employee_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Task
        fields = [
            'title', 'description', 'status', 'priority', 'start_date', 'end_date',
            'assigned_employee_ids'
        ]
    
    def update(self, instance, validated_data):
        assigned_employee_ids = validated_data.pop('assigned_employee_ids', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if assigned_employee_ids is not None:
            from employees.models import Employee
            employee_objects = Employee.objects.filter(id__in=assigned_employee_ids)
            user_ids = [emp.user.id for emp in employee_objects]
            employees = User.objects.filter(id__in=user_ids, role='EMPLOYE')
            instance.assigned_employees.set(employees)
        
        return instance


class SubTaskCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création de sous-tâches"""
    assigned_employee_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = SubTask
        fields = [
            'section_name', 'section_number', 'section_id', 'kilometrage',
            'task', 'assigned_employee_ids'
        ]
    
    def create(self, validated_data):
        assigned_employee_ids = validated_data.pop('assigned_employee_ids', [])
        subtask = SubTask.objects.create(**validated_data)
        
        if assigned_employee_ids:
            from employees.models import Employee
            employee_objects = Employee.objects.filter(id__in=assigned_employee_ids)
            user_ids = [emp.user.id for emp in employee_objects]
            employees = User.objects.filter(id__in=user_ids, role='EMPLOYE')
            subtask.assigned_employees.set(employees)
        
        return subtask


class SubTaskUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour de sous-tâches"""
    assigned_employee_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = SubTask
        fields = [
            'section_name', 'section_number', 'section_id', 'kilometrage',
            'is_completed', 'assigned_employee_ids'
        ]
    
    def update(self, instance, validated_data):
        assigned_employee_ids = validated_data.pop('assigned_employee_ids', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if assigned_employee_ids is not None:
            from employees.models import Employee
            employee_objects = Employee.objects.filter(id__in=assigned_employee_ids)
            user_ids = [emp.user.id for emp in employee_objects]
            employees = User.objects.filter(id__in=user_ids, role='EMPLOYE')
            instance.assigned_employees.set(employees)
        
        return instance