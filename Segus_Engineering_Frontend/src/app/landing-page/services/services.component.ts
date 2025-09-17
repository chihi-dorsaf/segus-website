import { Component } from '@angular/core';

interface Service {
  title: string;
  description: string;
  icon: string;
  features: string[];
}

interface ProcessStep {
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css']
})
export class ServicesComponent {
  services: Service[] = [
    {
      title: 'Ingénierie Mécanique',
      description: 'Conception et développement de systèmes mécaniques innovants avec des technologies de pointe.',
      icon: 'fas fa-cogs',
      features: ['CAO/DAO avancée', 'Simulation numérique', 'Prototypage rapide']
    },
    {
      title: 'Solutions Électroniques',
      description: 'Développement de circuits et systèmes électroniques pour applications industrielles.',
      icon: 'fas fa-microchip',
      features: ['Conception PCB', 'Systèmes embarqués', 'IoT industriel']
    },
    {
      title: 'Développement Logiciel',
      description: 'Applications et systèmes logiciels sur mesure pour optimiser vos processus.',
      icon: 'fas fa-laptop-code',
      features: ['Applications web', 'Logiciels métier', 'Intégration système']
    },
    {
      title: 'Automatisation Industrielle',
      description: 'Solutions d\'automatisation pour améliorer l\'efficacité de vos processus industriels.',
      icon: 'fas fa-robot',
      features: ['Systèmes SCADA', 'Robotique industrielle', 'Contrôle qualité']
    },
    {
      title: 'Consultation Technique',
      description: 'Expertise et conseils stratégiques pour vos projets d\'ingénierie complexes.',
      icon: 'fas fa-users-cog',
      features: ['Audit technique', 'Optimisation processus', 'Formation équipes']
    },
    {
      title: 'Maintenance & Support',
      description: 'Services de maintenance préventive et support technique pour vos équipements.',
      icon: 'fas fa-tools',
      features: ['Maintenance préventive', 'Support 24/7', 'Pièces détachées']
    }
  ];

  processSteps: ProcessStep[] = [
    {
      title: 'Analyse des Besoins',
      description: 'Étude approfondie de vos besoins et contraintes techniques.',
      icon: 'fas fa-search'
    },
    {
      title: 'Conception & Design',
      description: 'Élaboration de solutions techniques adaptées à vos spécifications.',
      icon: 'fas fa-drafting-compass'
    },
    {
      title: 'Développement',
      description: 'Réalisation et développement de la solution avec les meilleures pratiques.',
      icon: 'fas fa-code'
    },
    {
      title: 'Tests & Validation',
      description: 'Tests rigoureux et validation de la solution avant déploiement.',
      icon: 'fas fa-check-double'
    },
    {
      title: 'Déploiement',
      description: 'Mise en œuvre et intégration de la solution dans votre environnement.',
      icon: 'fas fa-rocket'
    },
    {
      title: 'Support Continu',
      description: 'Accompagnement et support technique pour assurer la pérennité.',
      icon: 'fas fa-headset'
    }
  ];
}
