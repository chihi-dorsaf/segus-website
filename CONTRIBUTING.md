# 🤝 Guide de Contribution - Segus Engineering

Merci de votre intérêt pour contribuer au projet Segus Engineering ! Ce guide vous aidera à contribuer efficacement.

## 📋 Code de Conduite

En participant à ce projet, vous acceptez de respecter notre code de conduite :
- Soyez respectueux et inclusif
- Acceptez les critiques constructives
- Concentrez-vous sur ce qui est le mieux pour la communauté
- Montrez de l'empathie envers les autres membres

## 🚀 Comment Contribuer

### Types de Contributions Bienvenues
- 🐛 **Corrections de bugs**
- ✨ **Nouvelles fonctionnalités**
- 📚 **Améliorations de documentation**
- 🎨 **Améliorations UI/UX**
- ⚡ **Optimisations de performance**
- 🧪 **Tests supplémentaires**

### Processus de Contribution

#### 1. Fork et Clone
```bash
# Fork le repository sur GitHub
# Puis cloner votre fork
git clone https://github.com/VOTRE-USERNAME/segus-website.git
cd segus-website
```

#### 2. Configuration de l'Environnement
```bash
# Backend
cd segus_engineering_Backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
pip install -r requirements.txt

# Frontend
cd ../Segus_Engineering_Frontend
npm install
```

#### 3. Créer une Branche
```bash
git checkout -b feature/nom-de-votre-fonctionnalite
# ou
git checkout -b bugfix/description-du-bug
```

#### 4. Développer
- Suivez les conventions de code
- Ajoutez des tests si nécessaire
- Mettez à jour la documentation

#### 5. Tester
```bash
# Backend
python manage.py test

# Frontend
ng test
ng lint
```

#### 6. Commit et Push
```bash
git add .
git commit -m "feat: description claire de votre changement"
git push origin feature/nom-de-votre-fonctionnalite
```

#### 7. Pull Request
- Créez une PR depuis votre fork vers la branche `main`
- Décrivez clairement vos changements
- Référencez les issues liées

## 📝 Conventions de Code

### Backend (Django/Python)
- **Style** : PEP 8
- **Docstrings** : Format Google
- **Imports** : Organisés par groupes (standard, tiers, local)
- **Nommage** : snake_case pour variables/fonctions, PascalCase pour classes

```python
# Exemple de fonction bien documentée
def calculate_project_progress(project_id: int) -> float:
    """
    Calcule le pourcentage de progression d'un projet.
    
    Args:
        project_id: L'ID du projet à analyser
        
    Returns:
        Le pourcentage de progression (0.0 à 100.0)
        
    Raises:
        Project.DoesNotExist: Si le projet n'existe pas
    """
    pass
```

### Frontend (Angular/TypeScript)
- **Style** : Angular Style Guide officiel
- **Nommage** : camelCase pour variables/méthodes, PascalCase pour classes
- **Composants** : kebab-case pour les sélecteurs
- **Services** : Suffixe `.service.ts`

```typescript
// Exemple de composant bien structuré
@Component({
  selector: 'app-project-card',
  templateUrl: './project-card.component.html',
  styleUrls: ['./project-card.component.css']
})
export class ProjectCardComponent implements OnInit {
  @Input() project!: Project;
  @Output() projectSelected = new EventEmitter<Project>();

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    // Initialisation
  }

  onSelectProject(): void {
    this.projectSelected.emit(this.project);
  }
}
```

## 🧪 Tests

### Tests Backend
```python
# tests/test_projects.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from projects.models import Project

User = get_user_model()

class ProjectModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )

    def test_project_creation(self):
        project = Project.objects.create(
            title='Test Project',
            description='Test Description'
        )
        self.assertEqual(project.title, 'Test Project')
```

### Tests Frontend
```typescript
// project-card.component.spec.ts
describe('ProjectCardComponent', () => {
  let component: ProjectCardComponent;
  let fixture: ComponentFixture<ProjectCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjectCardComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectCardComponent);
    component = fixture.componentInstance;
    component.project = mockProject;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit project when selected', () => {
    spyOn(component.projectSelected, 'emit');
    component.onSelectProject();
    expect(component.projectSelected.emit).toHaveBeenCalledWith(mockProject);
  });
});
```

## 📚 Documentation

### Commentaires de Code
- **Français** pour les commentaires métier
- **Anglais** pour les commentaires techniques
- Expliquez le "pourquoi", pas le "quoi"

### Documentation API
- Utilisez les docstrings Django REST Framework
- Documentez tous les paramètres et retours
- Incluez des exemples d'utilisation

## 🐛 Rapport de Bugs

### Template d'Issue Bug
```markdown
**Description du Bug**
Description claire et concise du bug.

**Étapes pour Reproduire**
1. Aller à '...'
2. Cliquer sur '...'
3. Voir l'erreur

**Comportement Attendu**
Description de ce qui devrait se passer.

**Captures d'Écran**
Si applicable, ajoutez des captures d'écran.

**Environnement**
- OS: [ex. Windows 10]
- Navigateur: [ex. Chrome 91]
- Version: [ex. 1.2.3]
```

## ✨ Demande de Fonctionnalité

### Template d'Issue Feature
```markdown
**Problème à Résoudre**
Description claire du problème que cette fonctionnalité résoudrait.

**Solution Proposée**
Description claire de ce que vous voulez qu'il se passe.

**Alternatives Considérées**
Description des solutions alternatives que vous avez considérées.

**Contexte Additionnel**
Ajoutez tout autre contexte ou captures d'écran sur la demande de fonctionnalité.
```

## 🔄 Processus de Review

### Critères d'Acceptation
- [ ] Code suit les conventions établies
- [ ] Tests passent (backend et frontend)
- [ ] Documentation mise à jour si nécessaire
- [ ] Pas de régression introduite
- [ ] Performance acceptable
- [ ] Sécurité respectée

### Processus de Review
1. **Review automatique** : CI/CD vérifie les tests et le linting
2. **Review manuelle** : Un mainteneur examine le code
3. **Tests** : Vérification fonctionnelle
4. **Merge** : Intégration dans la branche principale

## 🏷️ Conventions de Commit

Utilisez le format [Conventional Commits](https://www.conventionalcommits.org/) :

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation uniquement
- `style`: Changements qui n'affectent pas le sens du code
- `refactor`: Changement de code qui ne corrige pas de bug ni n'ajoute de fonctionnalité
- `perf`: Changement de code qui améliore les performances
- `test`: Ajout de tests manquants ou correction de tests existants
- `chore`: Changements aux outils de build ou dépendances

### Exemples
```
feat(dashboard): add employee performance charts
fix(auth): resolve JWT token expiration issue
docs(api): update endpoint documentation
style(header): improve notification panel styling
```

## 🎯 Roadmap et Priorités

### Priorités Actuelles
1. **Performance** : Optimisation des requêtes API
2. **Mobile** : Amélioration de la responsivité
3. **Tests** : Augmentation de la couverture de tests
4. **Documentation** : Guides utilisateur complets

### Fonctionnalités Futures
- Système de notifications push
- Intégration calendrier
- Rapports avancés
- API publique
- Application mobile native

## 🆘 Aide et Support

### Ressources
- **Documentation** : README.md et guides dans `/docs`
- **Issues** : [GitHub Issues](https://github.com/chihi-dorsaf/segus-website/issues)
- **Discussions** : [GitHub Discussions](https://github.com/chihi-dorsaf/segus-website/discussions)

### Contact
- **Email** : dev@segus-engineering.com
- **Discord** : [Serveur Segus Engineering](https://discord.gg/segus)

## 🙏 Remerciements

Merci à tous les contributeurs qui rendent ce projet possible ! Votre aide est précieuse pour améliorer Segus Engineering.

### Contributeurs Principaux
- [@chihi-dorsaf](https://github.com/chihi-dorsaf) - Créatrice et mainteneur principal

---

**Ensemble, construisons une meilleure plateforme de gestion de projets ! 🚀**
