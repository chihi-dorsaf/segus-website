import { Component, OnInit } from '@angular/core';
import { trigger, style, animate, transition, stagger, query } from '@angular/animations';

interface Service {
  id: number;
  title: string;
  description: string;
  icon: string;
}

interface Value {
  id: number;
  title: string;
  description: string;
  icon: string;
}

interface StatData {
  key: string;
  label: string;
  value: number;
  unit: string;
}

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerIn', [
      transition(':enter', [
        query('.service-card, .value-card, .stat-card', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(100, [
            animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class AboutComponent implements OnInit {
  services: Service[] = [
    {
      id: 1,
      title: 'Annotation de données',
      description: 'Nous vous aidons à structurer et nettoyer vos données pour des résultats optimaux.',
      icon: 'fas fa-database'
    },
    {
      id: 2,
      title: 'Développement d’IA',
      description: 'Conception de modèles d’intelligence artificielle adaptés à vos besoins spécifiques.',
      icon: 'fas fa-brain'
    },
    {
      id: 3,
      title: 'Automatisation intelligente',
      description: 'Simplifiez vos processus grâce à des solutions automatisées basées sur l’IA.',
      icon: 'fas fa-cogs'
    },
    {
      id: 4,
      title: 'Externalisation IT',
      description: 'Bénéficiez d’une gestion experte de vos projets informatiques pour gagner en productivité.',
      icon: 'fas fa-server'
    },
 
  ];

  values: Value[] = [
    {
      id: 1,
      title: 'Innovation',
      description: 'Nous repoussons les limites technologiques pour offrir des solutions uniques.',
      icon: 'fas fa-rocket'
    },
    {
      id: 2,
      title: 'Excellence',
      description: 'Nous visons la perfection dans chaque projet que nous entreprenons.',
      icon: 'fas fa-medal'
    },
    {
      id: 3,
      title: 'Collaboration',
      description: 'Nous travaillons main dans la main avec nos clients pour réussir.',
      icon: 'fas fa-handshake'
    }
  ];

  statsData: StatData[] = [
    { key: 'projects', label: 'Projets réalisés', value: 50, unit: '' },
    { key: 'satisfaction', label: 'Satisfaction client', value: 98, unit: '%' },
    { key: 'experience', label: 'Années d’expérience', value: 5, unit: '+' },
    { key: 'support', label: 'Support technique', value: 24, unit: 'h' }
  ];

  ngOnInit(): void {}

  trackByServiceId(index: number, service: Service): number {
    return service.id;
  }

  trackByValueId(index: number, value: Value): number {
    return value.id;
  }

  trackByStatKey(index: number, stat: StatData): string {
    return stat.key;
  }
}
