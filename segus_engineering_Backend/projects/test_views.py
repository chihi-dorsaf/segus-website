from datetime import date, timedelta

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from projects.models import Project, SubTask, Task

User = get_user_model()


class ProjectViewSetTest(APITestCase):
    """Tests pour le ViewSet Project"""

    def setUp(self):
        """Configuration initiale pour chaque test"""
        self.client = APIClient()

        # Créer un utilisateur admin
        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="adminpass123",
            role="ADMIN",
            first_name="Admin",
            last_name="User",
        )

        # Créer un utilisateur employé
        self.employee_user = User.objects.create_user(
            username="employee",
            email="employee@example.com",
            password="emppass123",
            role="EMPLOYE",
            first_name="Employee",
            last_name="User",
        )
        
        # Créer l'objet Employee correspondant
        from employees.models import Employee
        self.employee = Employee.objects.create(user=self.employee_user)

        # Créer un projet test
        self.project = Project.objects.create(
            title="Projet Test",
            description="Description du projet test",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            created_by=self.admin_user,
        )

        self.projects_url = "/api/projects/"

    def authenticate_user(self, user):
        """Méthode helper pour authentifier un utilisateur"""
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_list_projects_as_admin(self):
        """Test de listage des projets en tant qu'admin"""
        self.authenticate_user(self.admin_user)

        response = self.client.get(self.projects_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreaterEqual(len(response.data), 1)

    def test_list_projects_as_employee(self):
        """Test de listage des projets en tant qu'employé"""
        self.authenticate_user(self.employee_user)

        response = self.client.get(self.projects_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_projects_unauthenticated(self):
        """Test de listage des projets sans authentification"""
        response = self.client.get(self.projects_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_project_as_admin(self):
        """Test de récupération d'un projet en tant qu'admin"""
        self.authenticate_user(self.admin_user)

        response = self.client.get(f"{self.projects_url}{self.project.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.project.id)
        self.assertEqual(response.data["title"], "Projet Test")

    def test_create_project_as_admin(self):
        """Test de création de projet en tant qu'admin"""
        self.authenticate_user(self.admin_user)

        project_data = {
            "title": "Nouveau Projet",
            "description": "Description du nouveau projet",
            "start_date": date.today().isoformat(),
            "end_date": (date.today() + timedelta(days=60)).isoformat(),
            "status": "ACTIVE",
        }

        response = self.client.post(self.projects_url, project_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Nouveau Projet")
        self.assertEqual(response.data["created_by"], self.admin_user.id)

    def test_update_project_as_admin(self):
        """Test de mise à jour de projet en tant qu'admin"""
        self.authenticate_user(self.admin_user)

        update_data = {"title": "Projet Modifié", "status": "PAUSED"}

        response = self.client.patch(
            f"{self.projects_url}{self.project.id}/", update_data, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Projet Modifié")
        self.assertEqual(response.data["status"], "PAUSED")

    def test_delete_project_as_admin(self):
        """Test de suppression de projet en tant qu'admin"""
        self.authenticate_user(self.admin_user)

        # Créer un projet temporaire pour le supprimer
        temp_project = Project.objects.create(
            title="Projet Temporaire",
            description="À supprimer",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=10),
            created_by=self.admin_user,
        )

        response = self.client.delete(f"{self.projects_url}{temp_project.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Vérifier que le projet a été supprimé
        with self.assertRaises(Project.DoesNotExist):
            Project.objects.get(id=temp_project.id)

    def test_assign_employees_to_project(self):
        """Test d'assignation d'employés au projet"""
        self.authenticate_user(self.admin_user)

        assign_data = {"assigned_employee_ids": [self.employee.id]}

        response = self.client.patch(
            f"{self.projects_url}{self.project.id}/", assign_data, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(self.employee_user.id, response.data["assigned_employees"])

    def test_employee_cannot_create_project(self):
        """Test qu'un employé ne peut pas créer de projet"""
        self.authenticate_user(self.employee_user)

        project_data = {
            "title": "Projet Non Autorisé",
            "description": "Ne devrait pas être créé",
            "start_date": date.today().isoformat(),
            "end_date": (date.today() + timedelta(days=30)).isoformat(),
        }

        response = self.client.post(self.projects_url, project_data, format="json")

        self.assertIn(
            response.status_code,
            [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED],
        )


class TaskViewSetTest(APITestCase):
    """Tests pour le ViewSet Task"""

    def setUp(self):
        """Configuration initiale pour chaque test"""
        self.client = APIClient()

        # Créer un utilisateur admin
        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="adminpass123",
            role="ADMIN",
        )

        # Créer un utilisateur employé
        self.employee_user = User.objects.create_user(
            username="employee",
            email="employee@example.com",
            password="emppass123",
            role="EMPLOYE",
        )
        
        # Créer l'objet Employee correspondant
        from employees.models import Employee
        self.employee = Employee.objects.create(user=self.employee_user)

        # Créer un projet parent
        self.project = Project.objects.create(
            title="Projet Parent",
            description="Description projet",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            created_by=self.admin_user,
        )

        # Créer une tâche test
        self.task = Task.objects.create(
            title="Tâche Test",
            description="Description de la tâche test",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7),
            project=self.project,
            created_by=self.admin_user,
        )

        self.tasks_url = "/api/tasks/"

    def authenticate_user(self, user):
        """Méthode helper pour authentifier un utilisateur"""
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_list_tasks_as_admin(self):
        """Test de listage des tâches en tant qu'admin"""
        self.authenticate_user(self.admin_user)

        response = self.client.get(self.tasks_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreaterEqual(len(response.data), 1)

    def test_retrieve_task_as_admin(self):
        """Test de récupération d'une tâche en tant qu'admin"""
        self.authenticate_user(self.admin_user)

        response = self.client.get(f"{self.tasks_url}{self.task.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.task.id)
        self.assertEqual(response.data["title"], "Tâche Test")

    def test_create_task_as_admin(self):
        """Test de création de tâche en tant qu'admin"""
        self.authenticate_user(self.admin_user)

        task_data = {
            "title": "Nouvelle Tâche",
            "description": "Description de la nouvelle tâche",
            "start_date": date.today().isoformat(),
            "end_date": (date.today() + timedelta(days=5)).isoformat(),
            "project": self.project.id,
            "priority": "HIGH",
        }

        response = self.client.post(self.tasks_url, task_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Nouvelle Tâche")
        self.assertEqual(response.data["priority"], "HIGH")
        self.assertEqual(response.data["created_by"], self.admin_user.id)

    def test_update_task_status(self):
        """Test de mise à jour du statut d'une tâche"""
        self.authenticate_user(self.admin_user)

        update_data = {"status": "IN_PROGRESS"}

        response = self.client.patch(f"{self.tasks_url}{self.task.id}/", update_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "IN_PROGRESS")

    def test_assign_employees_to_task(self):
        """Test d'assignation d'employés à la tâche"""
        self.authenticate_user(self.admin_user)

        assign_data = {"assigned_employee_ids": [self.employee.id]}

        response = self.client.patch(f"{self.tasks_url}{self.task.id}/", assign_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(self.employee_user.id, response.data["assigned_employees"])

    def test_filter_tasks_by_project(self):
        """Test de filtrage des tâches par projet"""
        self.authenticate_user(self.admin_user)

        response = self.client.get(f"{self.tasks_url}?project={self.project.id}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for task in response.data:
            self.assertEqual(task["project"], self.project.id)

    def test_filter_tasks_by_status(self):
        """Test de filtrage des tâches par statut"""
        self.authenticate_user(self.admin_user)

        # Créer une tâche terminée
        _ = Task.objects.create(
            title="Tâche Terminée",
            description="Description",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=3),
            project=self.project,
            created_by=self.admin_user,
            status="COMPLETED",
        )

        response = self.client.get(f"{self.tasks_url}?status=COMPLETED")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["status"], "COMPLETED")


class SubTaskViewSetTest(APITestCase):
    """Tests pour le ViewSet SubTask"""

    def setUp(self):
        """Configuration initiale pour chaque test"""
        self.client = APIClient()

        # Créer un utilisateur admin
        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="adminpass123",
            role="ADMIN",
        )

        # Créer un utilisateur employé
        self.employee_user = User.objects.create_user(
            username="employee",
            email="employee@example.com",
            password="emppass123",
            role="EMPLOYE",
        )
        
        # Créer l'objet Employee correspondant
        from employees.models import Employee
        self.employee = Employee.objects.create(user=self.employee_user)

        # Créer un projet et une tâche parents
        self.project = Project.objects.create(
            title="Projet Parent",
            description="Description projet",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            created_by=self.admin_user,
        )

        self.task = Task.objects.create(
            title="Tâche Parent",
            description="Description tâche",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7),
            project=self.project,
            created_by=self.admin_user,
        )

        # Créer une sous-tâche test
        self.subtask = SubTask.objects.create(
            section_name="Section Test",
            section_number="S001",
            section_id="section_test_001",
            kilometrage=25.75,
            task=self.task,
            created_by=self.admin_user,
        )

        self.subtasks_url = "/api/subtasks/"

    def authenticate_user(self, user):
        """Méthode helper pour authentifier un utilisateur"""
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_list_subtasks_as_admin(self):
        """Test de listage des sous-tâches en tant qu'admin"""
        self.authenticate_user(self.admin_user)

        response = self.client.get(self.subtasks_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreaterEqual(len(response.data), 1)

    def test_retrieve_subtask_as_admin(self):
        """Test de récupération d'une sous-tâche en tant qu'admin"""
        self.authenticate_user(self.admin_user)

        response = self.client.get(f"{self.subtasks_url}{self.subtask.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.subtask.id)
        self.assertEqual(response.data["section_name"], "Section Test")

    def test_create_subtask_as_admin(self):
        """Test de création de sous-tâche en tant qu'admin"""
        self.authenticate_user(self.admin_user)

        subtask_data = {
            "section_name": "Nouvelle Section",
            "section_number": "S002",
            "section_id": "section_nouvelle_002",
            "kilometrage": 15.50,
            "task": self.task.id,
        }

        response = self.client.post(self.subtasks_url, subtask_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["section_name"], "Nouvelle Section")
        self.assertEqual(float(response.data["kilometrage"]), 15.50)
        self.assertEqual(response.data["created_by"], self.admin_user.id)

    def test_mark_subtask_completed(self):
        """Test de marquage d'une sous-tâche comme terminée"""
        self.authenticate_user(self.admin_user)

        response = self.client.post(
            f"{self.subtasks_url}{self.subtask.id}/mark_completed/", format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Vérifier que la sous-tâche est marquée comme terminée
        self.subtask.refresh_from_db()
        self.assertTrue(self.subtask.is_completed)
        self.assertIsNotNone(self.subtask.completed_at)

    def test_mark_subtask_uncompleted(self):
        """Test de marquage d'une sous-tâche comme non terminée"""
        self.authenticate_user(self.admin_user)

        # D'abord marquer comme terminée
        self.subtask.mark_completed()

        response = self.client.post(
            f"{self.subtasks_url}{self.subtask.id}/mark_uncompleted/", format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Vérifier que la sous-tâche n'est plus terminée
        self.subtask.refresh_from_db()
        self.assertFalse(self.subtask.is_completed)
        self.assertIsNone(self.subtask.completed_at)

    def test_filter_subtasks_by_task(self):
        """Test de filtrage des sous-tâches par tâche"""
        self.authenticate_user(self.admin_user)

        response = self.client.get(f"{self.subtasks_url}?task={self.task.id}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for subtask in response.data:
            self.assertEqual(subtask["task"], self.task.id)

    def test_filter_subtasks_by_completion_status(self):
        """Test de filtrage des sous-tâches par statut de completion"""
        self.authenticate_user(self.admin_user)

        # S'assurer que la sous-tâche existante n'est pas terminée
        self.subtask.is_completed = False
        self.subtask.save()

        # Créer une sous-tâche terminée
        _ = SubTask.objects.create(
            section_name="Section Terminée",
            section_number="S999",
            section_id="section_terminee_999",
            kilometrage=10.0,
            task=self.task,
            created_by=self.admin_user,
            is_completed=True,
        )

        response = self.client.get(f"{self.subtasks_url}?completed=true")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertTrue(response.data[0]["is_completed"])

    def test_assign_employees_to_subtask(self):
        """Test d'assignation d'employés à la sous-tâche"""
        self.authenticate_user(self.admin_user)

        assign_data = {"assigned_employee_ids": [self.employee.id]}

        response = self.client.patch(
            f"{self.subtasks_url}{self.subtask.id}/", assign_data, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(self.employee_user.id, response.data["assigned_employees"])

    def test_employee_can_view_assigned_subtasks(self):
        """Test qu'un employé peut voir ses sous-tâches assignées"""
        # Assigner la sous-tâche à l'employé
        self.subtask.assigned_employees.add(self.employee_user)

        self.authenticate_user(self.employee_user)

        response = self.client.get(f"{self.subtasks_url}?assigned_to_me=true")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_unauthorized_access_to_subtasks(self):
        """Test d'accès non autorisé aux sous-tâches"""
        response = self.client.get(self.subtasks_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
