from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta
from projects.models import Project, Task, SubTask

User = get_user_model()


class ProjectModelTest(TestCase):
    """Tests pour le modèle Project"""
    
    def setUp(self):
        """Configuration initiale pour chaque test"""
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            role='ADMIN'
        )
        self.employee_user = User.objects.create_user(
            username='employee',
            email='employee@example.com',
            password='emppass123',
            role='EMPLOYE'
        )
        
        self.project_data = {
            'title': 'Projet Test',
            'description': 'Description du projet test',
            'start_date': date.today(),
            'end_date': date.today() + timedelta(days=30),
            'created_by': self.admin_user
        }
    
    def test_create_project(self):
        """Test de création d'un projet"""
        project = Project.objects.create(**self.project_data)
        
        self.assertEqual(project.title, 'Projet Test')
        self.assertEqual(project.status, 'ACTIVE')
        self.assertEqual(project.created_by, self.admin_user)
        self.assertIsNotNone(project.created_at)
        self.assertIsNotNone(project.updated_at)
    
    def test_project_status_choices(self):
        """Test des choix de statut du projet"""
        project = Project.objects.create(**self.project_data)
        
        # Test des différents statuts
        valid_statuses = ['ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED']
        for status in valid_statuses:
            project.status = status
            project.save()
            project.refresh_from_db()
            self.assertEqual(project.status, status)
    
    def test_assign_employees(self):
        """Test d'assignation d'employés au projet"""
        project = Project.objects.create(**self.project_data)
        
        project.assigned_employees.add(self.employee_user)
        self.assertIn(self.employee_user, project.assigned_employees.all())
        self.assertEqual(project.assigned_employees.count(), 1)
    
    def test_string_representation(self):
        """Test de la représentation string"""
        project = Project.objects.create(**self.project_data)
        expected = f"{project.title} ({project.get_status_display()})"
        self.assertEqual(str(project), expected)
    
    def test_progress_percentage_no_tasks(self):
        """Test du pourcentage d'avancement sans tâches"""
        project = Project.objects.create(**self.project_data)
        self.assertEqual(project.progress_percentage, 0)
    
    def test_progress_percentage_with_tasks(self):
        """Test du pourcentage d'avancement avec tâches"""
        project = Project.objects.create(**self.project_data)
        
        # Créer 4 tâches
        for i in range(4):
            Task.objects.create(
                title=f'Tâche {i+1}',
                description=f'Description tâche {i+1}',
                start_date=date.today(),
                end_date=date.today() + timedelta(days=7),
                project=project,
                created_by=self.admin_user
            )
        
        # Marquer 2 tâches comme terminées
        tasks = project.tasks.all()[:2]
        for task in tasks:
            task.status = 'COMPLETED'
            task.save()
        
        # 2 tâches terminées sur 4 = 50%
        self.assertEqual(project.progress_percentage, 50.0)
    
    def test_total_tasks_property(self):
        """Test de la propriété total_tasks"""
        project = Project.objects.create(**self.project_data)
        self.assertEqual(project.total_tasks, 0)
        
        # Ajouter des tâches
        Task.objects.create(
            title='Tâche 1',
            description='Description',
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7),
            project=project,
            created_by=self.admin_user
        )
        self.assertEqual(project.total_tasks, 1)
    
    def test_completed_tasks_property(self):
        """Test de la propriété completed_tasks"""
        project = Project.objects.create(**self.project_data)
        
        # Créer une tâche terminée
        task = Task.objects.create(
            title='Tâche terminée',
            description='Description',
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7),
            project=project,
            created_by=self.admin_user,
            status='COMPLETED'
        )
        
        self.assertEqual(project.completed_tasks, 1)


class TaskModelTest(TestCase):
    """Tests pour le modèle Task"""
    
    def setUp(self):
        """Configuration initiale pour chaque test"""
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            role='ADMIN'
        )
        self.employee_user = User.objects.create_user(
            username='employee',
            email='employee@example.com',
            password='emppass123',
            role='EMPLOYE'
        )
        
        self.project = Project.objects.create(
            title='Projet Parent',
            description='Description projet',
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            created_by=self.admin_user
        )
        
        self.task_data = {
            'title': 'Tâche Test',
            'description': 'Description de la tâche test',
            'start_date': date.today(),
            'end_date': date.today() + timedelta(days=7),
            'project': self.project,
            'created_by': self.admin_user
        }
    
    def test_create_task(self):
        """Test de création d'une tâche"""
        task = Task.objects.create(**self.task_data)
        
        self.assertEqual(task.title, 'Tâche Test')
        self.assertEqual(task.status, 'TODO')
        self.assertEqual(task.priority, 'MEDIUM')
        self.assertEqual(task.project, self.project)
        self.assertEqual(task.created_by, self.admin_user)
    
    def test_task_status_choices(self):
        """Test des choix de statut de tâche"""
        task = Task.objects.create(**self.task_data)
        
        valid_statuses = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']
        for status in valid_statuses:
            task.status = status
            task.save()
            task.refresh_from_db()
            self.assertEqual(task.status, status)
    
    def test_task_priority_choices(self):
        """Test des choix de priorité"""
        task = Task.objects.create(**self.task_data)
        
        valid_priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
        for priority in valid_priorities:
            task.priority = priority
            task.save()
            task.refresh_from_db()
            self.assertEqual(task.priority, priority)
    
    def test_assign_employees(self):
        """Test d'assignation d'employés à la tâche"""
        task = Task.objects.create(**self.task_data)
        
        task.assigned_employees.add(self.employee_user)
        self.assertIn(self.employee_user, task.assigned_employees.all())
        self.assertEqual(task.assigned_employees.count(), 1)
    
    def test_string_representation(self):
        """Test de la représentation string"""
        task = Task.objects.create(**self.task_data)
        expected = f"{task.title} ({self.project.title})"
        self.assertEqual(str(task), expected)
    
    def test_progress_percentage_no_subtasks(self):
        """Test du pourcentage d'avancement sans sous-tâches"""
        task = Task.objects.create(**self.task_data)
        
        # Sans sous-tâches, le pourcentage dépend du statut
        self.assertEqual(task.progress_percentage, 0)
        
        task.status = 'COMPLETED'
        task.save()
        self.assertEqual(task.progress_percentage, 100)
    
    def test_progress_percentage_with_subtasks(self):
        """Test du pourcentage d'avancement avec sous-tâches"""
        task = Task.objects.create(**self.task_data)
        
        # Créer 4 sous-tâches
        for i in range(4):
            SubTask.objects.create(
                section_name=f'Section {i+1}',
                section_number=f'S{i+1}',
                section_id=f'section_{i+1}',
                kilometrage=10.5,
                task=task,
                created_by=self.admin_user
            )
        
        # Marquer 2 sous-tâches comme terminées
        subtasks = task.subtasks.all()[:2]
        for subtask in subtasks:
            subtask.is_completed = True
            subtask.save()
        
        # 2 sous-tâches terminées sur 4 = 50%
        self.assertEqual(task.progress_percentage, 50.0)
    
    def test_total_subtasks_property(self):
        """Test de la propriété total_subtasks"""
        task = Task.objects.create(**self.task_data)
        self.assertEqual(task.total_subtasks, 0)
        
        SubTask.objects.create(
            section_name='Section Test',
            section_number='S1',
            section_id='section_1',
            kilometrage=15.0,
            task=task,
            created_by=self.admin_user
        )
        self.assertEqual(task.total_subtasks, 1)
    
    def test_completed_subtasks_property(self):
        """Test de la propriété completed_subtasks"""
        task = Task.objects.create(**self.task_data)
        
        subtask = SubTask.objects.create(
            section_name='Section Terminée',
            section_number='S1',
            section_id='section_1',
            kilometrage=20.0,
            task=task,
            created_by=self.admin_user,
            is_completed=True
        )
        
        self.assertEqual(task.completed_subtasks, 1)


class SubTaskModelTest(TestCase):
    """Tests pour le modèle SubTask"""
    
    def setUp(self):
        """Configuration initiale pour chaque test"""
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            role='ADMIN'
        )
        
        self.project = Project.objects.create(
            title='Projet Parent',
            description='Description projet',
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            created_by=self.admin_user
        )
        
        self.task = Task.objects.create(
            title='Tâche Parent',
            description='Description tâche',
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7),
            project=self.project,
            created_by=self.admin_user
        )
        
        self.subtask_data = {
            'section_name': 'Section Test',
            'section_number': 'S001',
            'section_id': 'section_test_001',
            'kilometrage': 25.75,
            'task': self.task,
            'created_by': self.admin_user
        }
    
    def test_create_subtask(self):
        """Test de création d'une sous-tâche"""
        subtask = SubTask.objects.create(**self.subtask_data)
        
        self.assertEqual(subtask.section_name, 'Section Test')
        self.assertEqual(subtask.section_number, 'S001')
        self.assertEqual(subtask.section_id, 'section_test_001')
        self.assertEqual(subtask.kilometrage, 25.75)
        self.assertEqual(subtask.task, self.task)
        self.assertEqual(subtask.created_by, self.admin_user)
        self.assertFalse(subtask.is_completed)
        self.assertIsNone(subtask.completed_at)
    
    def test_string_representation(self):
        """Test de la représentation string"""
        subtask = SubTask.objects.create(**self.subtask_data)
        expected = f"{subtask.section_name} ({subtask.section_number})"
        self.assertEqual(str(subtask), expected)
    
    def test_mark_completed(self):
        """Test de marquage comme terminée"""
        subtask = SubTask.objects.create(**self.subtask_data)
        
        subtask.mark_completed()
        subtask.refresh_from_db()
        
        self.assertTrue(subtask.is_completed)
        self.assertIsNotNone(subtask.completed_at)
        
        # Vérifier que completed_at est récent (dans les 5 dernières secondes)
        time_diff = timezone.now() - subtask.completed_at
        self.assertLess(time_diff.total_seconds(), 5)
    
    def test_mark_uncompleted(self):
        """Test de marquage comme non terminée"""
        subtask = SubTask.objects.create(**self.subtask_data)
        
        # D'abord marquer comme terminée
        subtask.mark_completed()
        self.assertTrue(subtask.is_completed)
        
        # Puis marquer comme non terminée
        subtask.mark_uncompleted()
        subtask.refresh_from_db()
        
        self.assertFalse(subtask.is_completed)
        self.assertIsNone(subtask.completed_at)
    
    def test_assign_employees(self):
        """Test d'assignation d'employés à la sous-tâche"""
        employee = User.objects.create_user(
            username='employee',
            email='employee@example.com',
            password='emppass123'
        )
        
        subtask = SubTask.objects.create(**self.subtask_data)
        subtask.assigned_employees.add(employee)
        
        self.assertIn(employee, subtask.assigned_employees.all())
        self.assertEqual(subtask.assigned_employees.count(), 1)
    
    def test_kilometrage_decimal_precision(self):
        """Test de la précision décimale du kilométrage"""
        subtask_data = self.subtask_data.copy()
        subtask_data['kilometrage'] = 123.456789
        
        subtask = SubTask.objects.create(**subtask_data)
        
        # Vérifier que la précision est maintenue (2 décimales)
        self.assertEqual(float(subtask.kilometrage), 123.46)
