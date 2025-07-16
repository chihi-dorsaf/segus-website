import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { ServicesComponent } from './services/services.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { TeamComponent } from './team/team.component';
import { ReviewsComponent } from './reviews/reviews.component';
import { BlogComponent } from './blog/blog.component';
import { CareersPageComponent } from './careers-page/careers-page.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { ContactModalComponent } from './contact-modal/contact-modal.component';
import { MilestoneComponent } from './milestone/milestone.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    AboutComponent,
    ServicesComponent,
    PortfolioComponent,
    TeamComponent,
    ReviewsComponent,
    BlogComponent,
    CareersPageComponent,
    HeaderComponent,
    FooterComponent,
    ContactModalComponent,
    MilestoneComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
