import { Injectable, Injector } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private injector: Injector) {
    console.log('🔐 [AuthInterceptor] Constructor called - Interceptor initialized');
  }

  private get authService(): AuthService {
    return this.injector.get(AuthService);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('🔐 [AuthInterceptor] INTERCEPT CALLED for URL:', req.url);
    console.log('🔐 [AuthInterceptor] Request method:', req.method);
    console.log('🔐 [AuthInterceptor] Request headers:', req.headers);

    // Vérifier si c'est une requête vers notre API
    const isApiRequest = req.url.startsWith(environment.apiUrl);
    console.log('🔐 [AuthInterceptor] Is API request:', isApiRequest, 'API URL:', environment.apiUrl);

    if (!isApiRequest) {
      console.log('🔐 [AuthInterceptor] Not an API request, passing through');
      return next.handle(req);
    }

    // Vérifier si c'est une requête d'authentification ou publique
    const isAuthRequest = req.url.includes('/auth/') ||
                         req.url.includes('/jwt/') ||
                         req.url.includes('/login') ||
                         req.url.includes('/register') ||
                         req.url.includes('/password-reset/');

    // Vérifier si c'est une requête publique (job offers et applications pour careers page)
    const isPublicRequest = (req.url.includes('/jobs/offers/') && req.method === 'GET') ||
                           (req.url.includes('/jobs/applications/') && req.method === 'POST');
    
    // Vérifier si c'est une requête qui nécessite une authentification mais peut échouer gracieusement
    const isOptionalAuthRequest = false; // Désactivé car le backend nécessite l'authentification

    console.log('🔐 [AuthInterceptor] Is auth request:', isAuthRequest);
    console.log('🔐 [AuthInterceptor] Is public request:', isPublicRequest);

    // Pour les requêtes d'authentification ou publiques, ne pas ajouter de token
    if (isAuthRequest || isPublicRequest) {
      console.log('🔐 [AuthInterceptor] Auth/Public request, no token needed');
      return next.handle(req);
    }

    // Récupérer le token d'authentification
    const token = this.authService.getToken();
    console.log('🔐 [AuthInterceptor] Token available:', !!token);
    console.log('🔐 [AuthInterceptor] Token length:', token ? token.length : 0);

    if (!token) {
      console.warn('⚠️ [AuthInterceptor] No token available for API request');
      console.warn('⚠️ [AuthInterceptor] localStorage content:', localStorage);
      
      // Pour les requêtes optionnelles, continuer sans token
      if (isOptionalAuthRequest) {
        console.log('🔐 [AuthInterceptor] Optional auth request, proceeding without token');
        return next.handle(req);
      }
      
      return throwError(() => new Error('No authentication token available'));
    }

    // Cloner la requête et ajouter le header d'authentification
    const authReq = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('🔐 [AuthInterceptor] Original headers:', req.headers);
    console.log('🔐 [AuthInterceptor] Modified headers:', authReq.headers);
    console.log('🔐 [AuthInterceptor] Authorization header added:', `Bearer ${token.substring(0, 20)}...`);

    // Envoyer la requête avec le token et logger la réponse
    return next.handle(authReq).pipe(
      tap(response => {
        console.log('✅ [AuthInterceptor] Request successful:', {
          url: req.url,
          status: 'success',
          response: response
        });
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ [AuthInterceptor] Request failed:', {
          url: req.url,
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          headers: error.headers
        });

        if (error.status === 401) {
          console.error('❌ [AuthInterceptor] 401 Unauthorized - Token may be invalid or expired');
          console.error('❌ [AuthInterceptor] Request was sent with headers:', authReq.headers);
        }

        return throwError(() => error);
      })
    );
  }
}


