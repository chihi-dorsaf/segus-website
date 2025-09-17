import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { fadeInAnimation, slideInAnimation, scaleAnimation } from '../../animations';

@Component({
  selector: 'app-employee-work-hours-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  animations: [fadeInAnimation, slideInAnimation, scaleAnimation],
  template: `
    <div class="demo-container">
      <h2>🎯 Démonstration des Heures de Travail</h2>

      <div class="demo-card" [@fadeInAnimation]>
        <h3>✨ Interface Moderne</h3>
        <p>Design Material Design avec animations fluides</p>
        <button class="btn btn-primary" [@scaleAnimation]="'normal'">Démarrer une Session</button>
      </div>

      <div class="demo-card" [@slideInAnimation]>
        <h3>📊 Statistiques en Temps Réel</h3>
        <div class="stats-grid">
          <div class="stat-item" [@fadeInAnimation]>
            <span class="stat-value">8.5h</span>
            <span class="stat-label">Heures Totales</span>
          </div>
          <div class="stat-item" [@fadeInAnimation]>
            <span class="stat-value">1.2h</span>
            <span class="stat-label">Pauses</span>
          </div>
          <div class="stat-item" [@fadeInAnimation]>
            <span class="stat-value">85.9%</span>
            <span class="stat-label">Efficacité</span>
          </div>
        </div>
      </div>

      <div class="demo-card">
        <h3>🎭 Animations</h3>
        <p>Transitions fluides entre les états de session</p>
        <div class="animation-demo">
          <div class="session-state active">🟢 Active</div>
          <div class="session-state paused">🟡 En Pause</div>
          <div class="session-state completed">🔵 Terminée</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .demo-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .stat-item {
      text-align: center;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 8px;
    }

    .stat-value {
      display: block;
      font-size: 1.5rem;
      font-weight: bold;
      color: #4f46e5;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #6b7280;
    }

    .animation-demo {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }

    .session-state {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .session-state.active {
      background: #10b981;
      color: white;
    }

    .session-state.paused {
      background: #f59e0b;
      color: white;
    }

    .session-state.completed {
      background: #06b6d4;
      color: white;
    }

    .session-state:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: #4f46e5;
      color: white;
    }

    .btn-primary:hover {
      background: #3730a3;
      transform: translateY(-2px);
    }
  `]
})
export class EmployeeWorkHoursDemoComponent {
  // Composant de démonstration simple
}
