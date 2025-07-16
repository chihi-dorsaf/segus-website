import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { ServicesComponent } from './services/services.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { TeamComponent } from './team/team.component';
import { ReviewsComponent } from './reviews/reviews.component';
import { BlogComponent } from './blog/blog.component';
import { CareersPageComponent } from './careers-page/careers-page.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'services', component: ServicesComponent },
  { path: 'projets', component: PortfolioComponent }, 
  { path: 'team', component: TeamComponent },
  { path: 'reviews', component: ReviewsComponent },
  { path: 'blog', component: BlogComponent },
  { path: 'carriere', component: CareersPageComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
