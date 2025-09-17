import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-test-auth',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <div class="row">
        <div class="col-12">
          <h1 class="text-center text-primary mb-4">🔐 Test d'Authentification</h1>

          <!-- État actuel -->
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

          <!-- Test de l'API -->
          <div class="card mb-4">
            <div class="card-header bg-warning text-dark">
              <h5 class="card-title mb-0">Test de l'API Work Sessions</h5>
            </div>
            <div class="card-body">
              <button class="btn btn-primary me-2" (click)="testWorkSessions()" [disabled]="!hasToken">
                🔍 Test Work Sessions
              </button>
              <button class="btn btn-success me-2" (click)="testWithInterceptor()" [disabled]="!hasToken">
                🔐 Test avec Intercepteur
              </button>
              <button class="btn btn-info" (click)="testDirectHttp()" [disabled]="!hasToken">
                🌐 Test HTTP Direct
              </button>
            </div>
          </div>

          <!-- Résultats -->
          <div class="card" *ngIf="testResults.length > 0">
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
export class TestAuthComponent implements OnInit {
  hasToken = false;
  isAuthenticated = false;
  tokenPreview = '';
  testResults: any[] = [];

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.updateAuthStatus();
  }

  updateAuthStatus() {
    const token = this.authService.getToken();
    this.hasToken = !!token;
    this.isAuthenticated = this.authService.isAuthenticated();

    if (token) {
      this.tokenPreview = token.length > 50 ? token.substring(0, 50) + '...' : token;
    } else {
      this.tokenPreview = 'Aucun token';
    }
  }

  testWorkSessions() {
    console.log('🔍 [TestAuth] Testing work sessions API...');

    // Test avec l'endpoint qui pose problème
    this.http.get(`${environment.apiUrl}/work-sessions/current-session/`).subscribe({
      next: (response) => {
        console.log('✅ [TestAuth] Work sessions test successful:', response);
        this.addTestResult('Test Work Sessions', response, true);
      },
      error: (error) => {
        console.error('❌ [TestAuth] Work sessions test failed:', error);
        this.addTestResult('Test Work Sessions', error, false);
      }
    });
  }

  testWithInterceptor() {
    console.log('🔍 [TestAuth] Testing with interceptor...');

    // Test avec l'endpoint work-sessions
    this.http.get(`${environment.apiUrl}/work-sessions/`).subscribe({
      next: (response) => {
        console.log('✅ [TestAuth] Interceptor test successful:', response);
        this.addTestResult('Test avec Intercepteur', response, true);
      },
      error: (error) => {
        console.error('❌ [TestAuth] Interceptor test failed:', error);
        this.addTestResult('Test avec Intercepteur', error, false);
      }
    });
  }

  testDirectHttp() {
    console.log('🔍 [TestAuth] Testing direct HTTP...');

    const token = this.authService.getToken();
    if (!token) {
      this.addTestResult('Test HTTP Direct', { error: 'No token available' }, false);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.get(`${environment.apiUrl}/work-sessions/current-session/`, { headers }).subscribe({
      next: (response) => {
        console.log('✅ [TestAuth] Direct HTTP test successful:', response);
        this.addTestResult('Test HTTP Direct', response, true);
      },
      error: (error) => {
        console.error('❌ [TestAuth] Direct HTTP test failed:', error);
        this.addTestResult('Test HTTP Direct', error, false);
      }
    });
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






