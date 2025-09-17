import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SignInComponent } from './sign-in/sign-in.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { HomeComponent } from './landing-page/home/home.component';
import { AboutComponent } from './landing-page/about/about.component';
import { ServicesComponent } from './landing-page/services/services.component';
import { PortfolioComponent } from './landing-page/portfolio/portfolio.component';
import { TeamComponent } from './landing-page/team/team.component';
import { CareersPageComponent } from './landing-page/careers-page/careers-page.component';
import { MilestoneComponent } from './landing-page/milestone/milestone.component';
import { ReviewsComponent } from './landing-page/reviews/reviews.component';
import { BodyComponent } from './landing-page/body/body.component';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { TopNavComponent } from './shared/top-nav/top-nav.component';
import { ContactModalComponent } from './shared/contact-modal/contact-modal.component';

// BackOffice Components
import { AdminLayoutComponent } from './BackOffice/admin-layout/admin-layout.component';
import { AdminHeaderComponent } from './BackOffice/admin-header/admin-header.component';
import { AdminSidebarComponent } from './BackOffice/admin-sidebar/admin-sidebar.component';
import { AdminFooterComponent } from './BackOffice/admin-footer/admin-footer.component';
import { AdminDashboardComponent } from './BackOffice/admin-dashboard/admin-dashboard.component';
import { AdminEmployeesComponent } from './BackOffice/admin-employees/admin-employees.component';
import { AdminProjectsComponent } from './BackOffice/admin-projects/admin-projects.component';
import { AdminTasksComponent } from './BackOffice/admin-tasks/admin-tasks.component';
import { AdminReportsComponent } from './BackOffice/admin-reports/admin-reports.component';
import { EmployeeWorkHoursComponent } from './BackOffice/employee-work-hours/employee-work-hours.component';
import { ProjectDashboardComponent } from './BackOffice/project-dashboard/project-dashboard.component';
import { GamificationDashboardComponent } from './BackOffice/gamification-dashboard/gamification-dashboard.component';

// FrontOffice Components
import { FrontLayoutComponent } from './FrontOffice/front-layout-component/front-layout-component.component';
import { EmployeeDashboardComponent } from './FrontOffice/employee-dashboard/employee-dashboard.component';
import { EmployeeProfileComponent } from './FrontOffice/employee-profile/employee-profile.component';
import { EmployeeProjectsComponent } from './FrontOffice/employee-projects/employee-projects.component';
import { EmployeeTasksComponent } from './FrontOffice/employee-tasks/employee-tasks.component';

// Services
import  ApiService  from './services/api.service';
import { AuthService } from './services/auth.service';
import { EmployeeService } from './services/employee.service';
import { ProjectService } from './services/project.service';
import { TaskService } from './services/task.service';
import { EmployeeFrontofficeService } from './services/employee-frontoffice.service';
import { EmployeeWorkHoursService } from './services/employee-work-hours.service';
import { ContactService } from './services/contact.service';
import { ChatbotService } from './services/chatbot.service';
import { GamificationService } from './services/gamification.service';
import { NotificationService } from './services/notification.service';
import { AdminContactMessagesComponent } from './BackOffice/admin-contact-messages/admin-contact-messages.component';

// Chatbot Component
import { ChatbotComponent } from './components/chatbot/chatbot.component';

// Interceptors
import { AuthInterceptor } from './interceptors/auth.interceptor';

@NgModule({
    declarations: [
    AppComponent,
    LandingPageComponent,
    HomeComponent,
    AboutComponent,
    ServicesComponent,
    PortfolioComponent,
    TeamComponent,
    CareersPageComponent,
    MilestoneComponent,
    ReviewsComponent,
    BodyComponent,
    HeaderComponent,
    FooterComponent,
    TopNavComponent,
    ContactModalComponent,

    // FrontOffice Components (non-standalone)
    FrontLayoutComponent,
    
    // Gamification Components (non-standalone)
    GamificationDashboardComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppRoutingModule,

    // BackOffice Components (standalone)
    AdminLayoutComponent,
    AdminHeaderComponent,
    AdminSidebarComponent,
    AdminFooterComponent,
    AdminDashboardComponent,
    AdminEmployeesComponent,
    AdminProjectsComponent,
    AdminTasksComponent,
    AdminReportsComponent,
    EmployeeWorkHoursComponent,
    ProjectDashboardComponent,
    AdminContactMessagesComponent,

    // Auth Component (standalone)
    SignInComponent,
    
    // Chatbot Component (standalone)
    ChatbotComponent,
  ],
  providers: [

    AuthService,
    EmployeeService,
    ProjectService,
    TaskService,
    EmployeeFrontofficeService,
    EmployeeWorkHoursService,
    ChatbotService,
    GamificationService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
