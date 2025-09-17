import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {

  constructor(
    private titleService: Title,
    private metaService: Meta
  ) {}

  ngOnInit() {
    // Configuration SEO pour la page d'accueil
    this.titleService.setTitle('Segus Engineering - Solutions d\'Ingénierie Innovantes');
    
    this.metaService.updateTag({
      name: 'description',
      content: 'Segus Engineering propose des solutions d\'ingénierie innovantes et professionnelles. Découvrez nos services, projets et équipe d\'experts.'
    });
    
    this.metaService.updateTag({
      name: 'keywords',
      content: 'ingénierie, solutions techniques, innovation, projets, expertise, Segus Engineering'
    });
    
    this.metaService.updateTag({
      property: 'og:title',
      content: 'Segus Engineering - Solutions d\'Ingénierie Innovantes'
    });
    
    this.metaService.updateTag({
      property: 'og:description',
      content: 'Découvrez Segus Engineering, votre partenaire pour des solutions d\'ingénierie innovantes et sur mesure.'
    });
    
    this.metaService.updateTag({
      property: 'og:type',
      content: 'website'
    });
  }
}
