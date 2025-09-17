import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthDebugService {

  constructor(private http: HttpClient) {}

  /**
   * Test de connexion à l'API backend
   */
  testBackendConnection(): Observable<any> {
    console.log('🔍 [AuthDebug] Testing backend connection...');
    return this.http.get(`${environment.apiUrl}/`).pipe(
      tap(response => {
        console.log('✅ [AuthDebug] Backend connection successful:', response);
      }),
      catchError(error => {
        console.error('❌ [AuthDebug] Backend connection failed:', error);
        return of({ error: 'Backend connection failed', details: error });
      })
    );
  }

  /**
   * Test d'authentification avec token
   */
  testAuthenticationWithToken(token: string): Observable<any> {
    console.log('🔍 [AuthDebug] Testing authentication with token...');
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // Test avec l'endpoint work-sessions qui pose problème
    return this.http.get(`${environment.apiUrl}/work-sessions/current-session/`, { headers }).pipe(
      tap(response => {
        console.log('✅ [AuthDebug] Authentication test successful:', response);
      }),
      catchError(error => {
        console.error('❌ [AuthDebug] Authentication test failed:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          headers: error.headers
        });
        return of({ error: 'Authentication test failed', details: error });
      })
    );
  }

  /**
   * Test des headers de la requête
   */
  testRequestHeaders(): Observable<any> {
    console.log('🔍 [AuthDebug] Testing request headers...');
    
    // Test simple pour vérifier que l'API répond
    return this.http.get(`${environment.apiUrl}/work-sessions/`, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-Debug': 'true'
      })
    }).pipe(
      tap(response => {
        console.log('✅ [AuthDebug] Headers test successful:', response);
      }),
      catchError(error => {
        console.error('❌ [AuthDebug] Headers test failed:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error
        });
        return of({ error: 'Headers test failed', details: error });
      })
    );
  }

  /**
   * Diagnostic complet de l'authentification
   */
  runFullDiagnostic(): Observable<any> {
    console.log('🔍 [AuthDebug] Running full authentication diagnostic...');
    
    const diagnostic = {
      timestamp: new Date().toISOString(),
      environment: environment,
      tests: {}
    };

    // Test 1: Connexion backend
    return this.testBackendConnection().pipe(
      tap(result => {
        diagnostic.tests.backendConnection = result;
        console.log('📊 [AuthDebug] Backend connection test completed');
      }),
      catchError(error => {
        diagnostic.tests.backendConnection = { error: 'Test failed', details: error };
        return of(diagnostic);
      })
    );
  }

  /**
   * Vérifier la configuration CORS
   */
  testCORS(): Observable<any> {
    console.log('🔍 [AuthDebug] Testing CORS configuration...');
    
    // Test avec une requête OPTIONS pour vérifier CORS
    return this.http.options(`${environment.apiUrl}/work-sessions/`, {
      headers: new HttpHeaders({
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization,Content-Type'
      })
    }).pipe(
      tap(response => {
        console.log('✅ [AuthDebug] CORS test successful:', response);
      }),
      catchError(error => {
        console.error('❌ [AuthDebug] CORS test failed:', error);
        return of({ error: 'CORS test failed', details: error });
      })
    );
  }
}
