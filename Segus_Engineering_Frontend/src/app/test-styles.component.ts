import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-test-styles',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <div class="row">
        <div class="col-12">
          <h1 class="text-center text-primary mb-4">Test des Styles - Segus Engineering</h1>

          <!-- Test Bootstrap -->
          <div class="card mb-4">
            <div class="card-header bg-primary text-white">
              <h5 class="card-title mb-0">Test Bootstrap</h5>
            </div>
            <div class="card-body">
              <p class="card-text">Ceci est un test pour vérifier que Bootstrap fonctionne correctement.</p>
              <button class="btn btn-primary me-2">Bouton Primary</button>
              <button class="btn btn-secondary me-2">Bouton Secondary</button>
              <button class="btn btn-success">Bouton Success</button>
            </div>
          </div>

          <!-- Test Styles Personnalisés -->
          <div class="card mb-4">
            <div class="card-header bg-segus-primary text-white">
              <h5 class="card-title mb-0">Test Styles Personnalisés</h5>
            </div>
            <div class="card-body">
              <p class="card-text">Test des couleurs et styles personnalisés de Segus Engineering.</p>
              <button class="btn btn-brand me-2">Bouton Brand</button>
              <button class="btn btn-outline-primary">Bouton Outline</button>
            </div>
          </div>

          <!-- Test Navigation -->
          <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4">
            <div class="container-fluid">
              <a class="navbar-brand" href="#">Segus Engineering</a>
              <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
              </button>
              <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav">
                  <li class="nav-item">
                    <a class="nav-link active" href="#">Accueil</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="#">À propos</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="#">Services</a>
                  </li>
                </ul>
              </div>
            </div>
          </nav>

          <!-- Test Grille Bootstrap -->
          <div class="row mb-4">
            <div class="col-md-4">
              <div class="card">
                <div class="card-body text-center">
                  <h5 class="card-title">Colonne 1</h5>
                  <p class="card-text">Test de la grille responsive Bootstrap.</p>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card">
                <div class="card-body text-center">
                  <h5 class="card-title">Colonne 2</h5>
                  <p class="card-text">Test de la grille responsive Bootstrap.</p>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card">
                <div class="card-body text-center">
                  <h5 class="card-title">Colonne 3</h5>
                  <p class="card-text">Test de la grille responsive Bootstrap.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Test Alertes -->
          <div class="alert alert-success" role="alert">
            <strong>Succès !</strong> Les styles Bootstrap sont correctement chargés.
          </div>

          <div class="alert alert-info" role="alert">
            <strong>Info :</strong> Les styles personnalisés de Segus Engineering sont également appliqués.
          </div>

          <!-- Test Formulaires -->
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Test Formulaire</h5>
            </div>
            <div class="card-body">
              <form>
                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input type="email" class="form-control" id="email" placeholder="votre@email.com">
                </div>
                <div class="mb-3">
                  <label for="password" class="form-label">Mot de passe</label>
                  <input type="password" class="form-control" id="password" placeholder="Mot de passe">
                </div>
                <div class="mb-3 form-check">
                  <input type="checkbox" class="form-check-input" id="remember">
                  <label class="form-check-label" for="remember">Se souvenir de moi</label>
                </div>
                <button type="submit" class="btn btn-primary">Se connecter</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bg-segus-primary {
      background-color: #002552 !important;
    }

    .card {
      box-shadow: 0 2px 10px rgba(0, 37, 82, 0.1);
      border: none;
      border-radius: 12px;
    }

    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 37, 82, 0.15);
      transition: all 0.3s ease;
    }

    .btn-brand {
      background-color: #002552;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 0.75rem 2rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .btn-brand:hover {
      background-color: #1a73c1;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0, 37, 82, 0.3);
    }
  `]
})
export class TestStylesComponent {}






