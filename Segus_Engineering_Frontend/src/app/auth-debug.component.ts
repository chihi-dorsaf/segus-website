import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { AuthDebugService } from './services/auth-debug.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-auth-debug',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <div class="row">
        <div class="col-12">
          <h1 class="text-center text-primary mb-4">🔍 Diagnostic d'Authentification</h1>

          <!-- État de l'authentification -->
          <div class="card mb-4">
            <div class="card-header bg-info text-white">
              <h5 class="card-title mb-0">État de l'Authentification</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <p><strong>Token présent :</strong>
                    <span class="badge" [ngClass]="{'bg-success': hasToken, 'bg-danger': !hasToken}">
                      {{ hasToken ? 'OUI' : 'NON' }}
                    </span>
                  </p>
                  <p><strong>Utilisateur connecté :</strong>
                    <span class="badge" [ngClass]="{'bg-success': isAuthenticated, 'bg-danger': !isAuthenticated}">
                      {{ isAuthenticated ? 'OUI' : 'NON' }}
                    </span>
                  </p>
                  <p><strong>Token valide :</strong>
                    <span class="badge" [ngClass]="{'bg-success': isTokenValid, 'bg-danger': !isTokenValid}">
                      {{ isTokenValid ? 'OUI' : 'NON' }}
                    </span>
                  </p>
                </div>
                <div class="col-md-6">
                  <p><strong>Token :</strong></p>
                  <code class="d-block p-2 bg-light" style="word-break: break-all; font-size: 0.8rem;">
                    {{ tokenPreview }}
                  </code>
                </div>
              </div>
            </div>
          </div>

          <!-- Tests d'authentification -->
          <div class="card mb-4">
            <div class="card-header bg-warning text-dark">
              <h5 class="card-title mb-0">Tests d'Authentification</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-4">
                  <button class="btn btn-primary w-100 mb-2" (click)="testBackendConnection()">
                    🔗 Test Connexion Backend
                  </button>
                </div>
                <div class="col-md-4">
                  <button class="btn btn-success w-100 mb-2" (click)="testAuthentication()" [disabled]="!hasToken">
                    🔐 Test Authentification
                  </button>
                </div>
                <div class="col-md-4">
                  <button class="btn btn-info w-100 mb-2" (click)="testCORS()">
                    🌐 Test CORS
                  </button>
                </div>
              </div>

              <div class="row mt-3">
                <div class="col-12">
                  <button class="btn btn-secondary w-100" (click)="runFullDiagnostic()">
                    🔍 Diagnostic Complet
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Résultats des tests -->
          <div class="card mb-4" *ngIf="testResults.length > 0">
            <div class="card-header bg-secondary text-white">
              <h5 class="card-title mb-0">Résultats des Tests</h5>
            </div>
            <div class="card-body">
              <div class="test-result" *ngFor="let result of testResults; let i = index">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h6 class="mb-0">{{ result.test }}</h6>
                  <span class="badge" [ngClass]="{'bg-success': result.success, 'bg-danger': !result.success}">
                    {{ result.success ? 'SUCCÈS' : 'ÉCHEC' }}
                  </span>
                </div>
                <div class="bg-light p-2 rounded">
                  <pre class="mb-0" style="font-size: 0.8rem;">{{ result.details | json }}</pre>
                </div>
                <hr *ngIf="i < testResults.length - 1">
              </div>
            </div>
          </div>

          <!-- Actions de débogage -->
          <div class="card">
            <div class="card-header bg-danger text-white">
              <h5 class="card-title mb-0">Actions de Débogage</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-4">
                  <button class="btn btn-outline-danger w-100 mb-2" (click)="clearTokens()">
                    🗑️ Effacer Tokens
                  </button>
                </div>
                <div class="col-md-4">
                  <button class="btn btn-outline-warning w-100 mb-2" (click)="refreshTokens()">
                    🔄 Rafraîchir Tokens
                  </button>
                </div>
                <div class="col-md-4">
                  <button class="btn btn-outline-info w-100 mb-2" (click)="showEnvironment()">
                    ⚙️ Configuration
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .test-result {
      margin-bottom: 1rem;
    }

    .test-result:last-child {
      margin-bottom: 0;
    }

    pre {
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 0.25rem;
      padding: 0.5rem;
      margin: 0;
    }

    .badge {
      font-size: 0.75rem;
    }

    code {
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 0.25rem;
    }
  `]
})
export class AuthDebugComponent implements OnInit {
  hasToken = false;
  isAuthenticated = false;
  isTokenValid = false;
  tokenPreview = '';
  testResults: any[] = [];

  constructor(
    private authService: AuthService,
    private authDebugService: AuthDebugService
  ) {}

  ngOnInit() {
    this.updateAuthStatus();
  }

  updateAuthStatus() {
    const token = this.authService.getToken();
    this.hasToken = !!token;
    this.isAuthenticated = this.authService.isAuthenticated();
    this.isTokenValid = this.authService.isTokenValid();

    if (token) {
      this.tokenPreview = token.length > 50 ? token.substring(0, 50) + '...' : token;
    } else {
      this.tokenPreview = 'Aucun token';
    }
  }

  testBackendConnection() {
    this.authDebugService.testBackendConnection().subscribe(result => {
      this.addTestResult('Test Connexion Backend', result, !result.error);
    });
  }

  testAuthentication() {
    const token = this.authService.getToken();
    if (token) {
      this.authDebugService.testAuthenticationWithToken(token).subscribe(result => {
        this.addTestResult('Test Authentification', result, !result.error);
      });
    }
  }

  testCORS() {
    this.authDebugService.testCORS().subscribe(result => {
      this.addTestResult('Test CORS', result, !result.error);
    });
  }

  runFullDiagnostic() {
    this.authDebugService.runFullDiagnostic().subscribe(result => {
      this.addTestResult('Diagnostic Complet', result, true);
    });
  }

  clearTokens() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    this.updateAuthStatus();
    this.addTestResult('Effacer Tokens', { message: 'Tokens supprimés' }, true);
  }

  refreshTokens() {
    this.authService.refreshTokenIfNeeded().subscribe(success => {
      this.updateAuthStatus();
      this.addTestResult('Rafraîchir Tokens', { success }, success);
    });
  }

  showEnvironment() {
    this.addTestResult('Configuration', {
      apiUrl: environment.apiUrl,
      userAgent: navigator.userAgent,
      location: window.location.href
    }, true);
  }

  private addTestResult(test: string, details: any, success: boolean) {
    this.testResults.unshift({
      test,
      details,
      success,
      timestamp: new Date().toLocaleTimeString()
    });

    // Limiter à 10 résultats
    if (this.testResults.length > 10) {
      this.testResults = this.testResults.slice(0, 10);
    }
  }
}











