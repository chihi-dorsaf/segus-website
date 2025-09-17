import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { HomeComponent } from './landing-page/home/home.component';
import { AboutComponent } from './landing-page/about/about.component';
import { ServicesComponent } from './landing-page/services/services.component';
import { PortfolioComponent } from './landing-page/portfolio/portfolio.component';
import { TeamComponent } from './landing-page/team/team.component';
import { ReviewsComponent } from './landing-page/reviews/reviews.component';
import { CareersPageComponent } from './landing-page/careers-page/careers-page.component';
import { AdminLayoutComponent } from './BackOffice/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './BackOffice/admin-dashboard/admin-dashboard.component';
import { AdminEmployeesComponent } from './BackOffice/admin-employees/admin-employees.component';
import { AdminTasksComponent } from './BackOffice/admin-tasks/admin-tasks.component';
import { AdminSubtasksComponent } from './BackOffice/admin-subtasks/admin-subtasks.component';
import { AdminProjectsComponent } from './BackOffice/admin-projects/admin-projects.component';
import { AdminReportsComponent } from './BackOffice/admin-reports/admin-reports.component';
import { SignInComponent } from './sign-in/sign-in.component';
import { ProjectDashboardComponent } from './BackOffice/project-dashboard/project-dashboard.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { EmployeeDashboardComponent } from './FrontOffice/employee-dashboard/employee-dashboard.component';
import { EmployeeTasksComponent } from './FrontOffice/employee-tasks/employee-tasks.component';
import { EmployeeProjectsComponent } from './FrontOffice/employee-projects/employee-projects.component';
import { FrontLayoutComponent } from './FrontOffice/front-layout-component/front-layout-component.component';
import { EmployeeProfileComponent } from './FrontOffice/employee-profile/employee-profile.component';
import { EmployeeSettingsComponent } from './FrontOffice/employee-settings/employee-settings.component';
import { EmployeeCalendarComponent } from './FrontOffice/employee-calendar/employee-calendar.component';
import { EmployeeReportsComponent } from './FrontOffice/employee-reports/employee-reports.component';
import { EmployeeWorkHoursComponent } from './BackOffice/employee-work-hours/employee-work-hours.component';
import { GamificationDashboardComponent } from './BackOffice/gamification-dashboard/gamification-dashboard.component';
import { AdminProfileComponent } from './BackOffice/admin-profile/admin-profile.component';
import { AdminContactMessagesComponent } from './BackOffice/admin-contact-messages/admin-contact-messages.component';
const routes: Routes = [
  // Page d'accueil unifiée du site vitrine
  { path: '', component: LandingPageComponent },
  
  // Routes individuelles pour navigation directe (optionnel)
  { path: 'home', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'services', component: ServicesComponent },
  { path: 'projets', component: PortfolioComponent },
  { path: 'team', component: TeamComponent },
  { path: 'reviews', component: ReviewsComponent },
  { path: 'carriere', component: CareersPageComponent },


  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'employees', component: AdminEmployeesComponent },
      { path: 'tasks', component: AdminTasksComponent },
      { path: 'subtasks', component: AdminSubtasksComponent },
      { path: 'projects', component: AdminProjectsComponent },
      { path: 'reports', component: AdminReportsComponent },
      { path: 'sessions', component :  EmployeeWorkHoursComponent},
      { path: 'gamification', component: GamificationDashboardComponent },
      { path: 'profile', component: AdminProfileComponent },
      { path: 'contact-messages', component: AdminContactMessagesComponent },
      { path: 'contact-messages/:id', component: AdminContactMessagesComponent },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  {
    path: 'frontoffice',
    component: FrontLayoutComponent,
    children: [
      { path: 'dashboard', component: EmployeeDashboardComponent },
      { path: 'tasks', component: EmployeeTasksComponent },
      { path: 'projects', component: EmployeeProjectsComponent },
      { path: 'calendar', component: EmployeeCalendarComponent },
      { path: 'reports', component: EmployeeReportsComponent },
      { path: 'profile', component: EmployeeProfileComponent },
      { path: 'settings', component: EmployeeSettingsComponent },
      { path: 'gamification', component: GamificationDashboardComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: 'login', component: SignInComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
