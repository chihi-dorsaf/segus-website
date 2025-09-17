import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
  encapsulation: ViewEncapsulation.None // Désactiver l'encapsulation pour éviter les conflits de styles
})
export class FooterComponent implements OnInit, AfterViewInit, OnDestroy {
  email: string = ''; // Champ pour stocker l'email de la newsletter
  private floatingInterval: any; // Intervalle pour les éléments flottants
  private animationTimeline: gsap.core.Timeline | null = null; // Timeline GSAP pour les animations

  @ViewChild('floatingElements', { static: false }) floatingElements!: ElementRef; // Référence aux éléments flottants

  constructor(private router: Router) {
    // Enregistrer le plugin ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);
  }

  ngOnInit(): void {
    // Initialisation des variables
    this.email = '';
  }

  ngAfterViewInit(): void {
    // Délai pour s'assurer que le DOM est complètement chargé
    setTimeout(() => {
      this.initializeAnimations();
      this.setupInteractiveElements();
      this.createFloatingElements();
    }, 100);
  }

  ngOnDestroy(): void {
    // Nettoyage des animations et intervalles
    if (this.floatingInterval) {
      clearInterval(this.floatingInterval);
    }
    if (this.animationTimeline) {
      this.animationTimeline.kill();
    }
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }

  private initializeAnimations(): void {
    // Animation d'entrée du footer avec ScrollTrigger
    this.animationTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: '.footer-container',
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse'
      }
    });

    // Animation des sections du footer
    this.animationTimeline
      .from('.brand-section', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out'
      })
      .from('.footer-section', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out'
      }, '-=0.4')
      .from('.footer-bottom', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power2.out'
      }, '-=0.2');

    // Animation du logo
    gsap.from('.brand-logo', {
      opacity: 0,
      scale: 0.9,
      duration: 1,
      ease: 'elastic.out(1, 0.5)',
      scrollTrigger: {
        trigger: '.brand-logo',
        start: 'top 90%',
        toggleActions: 'play none none reverse'
      }
    });
  }

  private setupInteractiveElements(): void {
    // Animation des icônes sociales
    const socialIcons = document.querySelectorAll('.social-icon');
    socialIcons.forEach((icon, index) => {
      const element = icon as HTMLElement;

      // Animation d'entrée échelonnée
      gsap.from(element, {
        opacity: 0,
        y: 20,
        duration: 0.6,
        delay: index * 0.1,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: '.social-icons',
          start: 'top 90%',
          toggleActions: 'play none none reverse'
        }
      });

      // Effets de survol améliorés
      element.addEventListener('mouseenter', () => {
        gsap.to(element, {
          scale: 1.1,
          rotation: 5,
          duration: 0.3,
          ease: 'power2.out'
        });
      });

      element.addEventListener('mouseleave', () => {
        gsap.to(element, {
          scale: 1,
          rotation: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      });
    });

    // Animation des liens du footer
    const footerLinks = document.querySelectorAll('.footer-links a');
    footerLinks.forEach(link => {
      const element = link as HTMLElement;

      element.addEventListener('mouseenter', () => {
        gsap.to(element, {
          x: 8,
          duration: 0.3,
          ease: 'power2.out'
        });
      });

      element.addEventListener('mouseleave', () => {
        gsap.to(element, {
          x: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      });
    });

    // Animation du formulaire newsletter
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
      gsap.from(newsletterForm, {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.newsletter-section',
          start: 'top 90%',
          toggleActions: 'play none none reverse'
        }
      });
    }
  }

  private createFloatingElements(): void {
    const container = this.floatingElements?.nativeElement;
    if (!container) return;

    const createElement = () => {
      const element = document.createElement('div');
      element.className = 'floating-element';

      // Position aléatoire
      element.style.left = Math.random() * 100 + '%';

      // Délai et durée aléatoires
      const delay = Math.random() * 3;
      const duration = Math.random() * 10 + 15;

      element.style.animationDelay = delay + 's';
      element.style.animationDuration = duration + 's';

      // Couleurs variées mais cohérentes
      const colors = ['#4299e1', '#63b3ed', '#90cdf4', '#bee3f8'];
      const selectedColor = colors[Math.floor(Math.random() * colors.length)];
      element.style.background = selectedColor;
      element.style.boxShadow = `0 0 8px ${selectedColor}`;

      // Taille variable
      const size = Math.random() * 3 + 2;
      element.style.width = size + 'px';
      element.style.height = size + 'px';

      container.appendChild(element);

      // Animation GSAP pour un mouvement plus fluide
      gsap.to(element, {
        y: -window.innerHeight - 100,
        x: Math.random() * 200 - 100,
        rotation: 360,
        duration: duration,
        ease: 'none',
        onComplete: () => {
          if (element.parentNode) {
            element.remove();
          }
        }
      });

      // Suppression automatique de sécurité
      setTimeout(() => {
        if (element.parentNode) {
          element.remove();
        }
      }, duration * 1000 + 1000);
    };

    // Création d'éléments à intervalles réguliers
    this.floatingInterval = setInterval(createElement, 800);
  }

  onNavigate(event: Event, path: string): void {
    event.preventDefault();

    // Animation de clic
    const target = event.target as HTMLElement;
    gsap.to(target, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut'
    });

    // Navigation avec délai pour l'animation
    setTimeout(() => {
      this.router.navigate([path]);
    }, 150);
  }

  onSocialClick(event: Event, platform: string): void {
    event.preventDefault();

    const target = event.target as HTMLElement;
    const icon = target.closest('.social-icon') as HTMLElement;

    // Animation de clic
    gsap.to(icon, {
      scale: 0.9,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut'
    });

    // Logique de redirection sociale
    const socialUrls: { [key: string]: string } = {
      facebook: 'https://facebook.com/segusengineering',
      twitter: 'https://twitter.com/segusengineering',
      linkedin: 'https://linkedin.com/company/segus-engineering',
      instagram: 'https://instagram.com/segusengineering',
      github: 'https://github.com/segusengineering'
    };

    if (socialUrls[platform]) {
      setTimeout(() => {
        window.open(socialUrls[platform], '_blank', 'noopener,noreferrer');
      }, 150);
    }
  }

  onNewsletterSubmit(): void {
    if (!this.validateEmail(this.email)) {
      this.showNotification('Veuillez entrer une adresse email valide.', false);
      return;
    }

    if (this.email.trim()) {
      const btn = document.querySelector('.newsletter-btn') as HTMLButtonElement;
      const input = document.querySelector('.newsletter-input') as HTMLInputElement;

      // Animation de soumission
      gsap.to(btn, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut'
      });

      // Changement visuel temporaire
      const originalBg = btn.style.background;
      const originalContent = btn.innerHTML;

      // Animation de succès
      btn.innerHTML = '<i class="fas fa-check"></i>';
      btn.style.background = '#48bb78';

      gsap.to(btn, {
        scale: 1.1,
        duration: 0.3,
        ease: 'back.out(1.7)'
      });

      // Animation de l'input
      gsap.to(input, {
        scale: 1.02,
        duration: 0.3,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut'
      });

      // Simulation d'envoi
      setTimeout(() => {
        // Retour à l'état normal
        btn.innerHTML = originalContent;
        btn.style.background = originalBg;

        gsap.to(btn, {
          scale: 1,
          duration: 0.3,
          ease: 'power2.out'
        });

        // Vider le champ email
        this.email = '';

        // Message de confirmation
        this.showNotification('Merci pour votre inscription !');
      }, 2000);
    }
  }

  private showNotification(message: string, isSuccess: boolean = true): void {
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${isSuccess ? '#48bb78' : '#ef4444'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        font-size: 0.9rem;
        font-weight: 500;
      ">
        <i class="fas ${isSuccess ? 'fa-check-circle' : 'fa-exclamation-circle'}" style="margin-right: 0.5rem;"></i>
        ${message}
      </div>
    `;

    document.body.appendChild(notification);

    // Animation d'entrée
    gsap.from(notification.firstElementChild, {
      x: 300,
      opacity: 0,
      duration: 0.5,
      ease: 'power3.out'
    });

    // Suppression automatique
    setTimeout(() => {
      gsap.to(notification.firstElementChild, {
        x: 300,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          if (notification.parentNode) {
            notification.remove();
          }
        }
      });
    }, 3000);
  }

  // Méthode pour gérer les animations sur défilement
  private animateOnScroll(selector: string, options: any = {}): void {
    const defaultOptions = {
      opacity: 0,
      y: 30,
      duration: 0.8,
      ease: 'power2.out',
      stagger: 0.1
    };

    const finalOptions = { ...defaultOptions, ...options };

    gsap.from(selector, {
      ...finalOptions,
      scrollTrigger: {
        trigger: selector,
        start: 'top 90%',
        toggleActions: 'play none none reverse'
      }
    });
  }

  // Méthode pour créer un effet de vague (ripple)
  private createRippleEffect(element: HTMLElement): void {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (rect.width / 2 - size / 2) + 'px';
    ripple.style.top = (rect.height / 2 - size / 2) + 'px';
    ripple.classList.add('ripple');

    element.appendChild(ripple);

    // Animation du ripple
    gsap.to(ripple, {
      scale: 4,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
      onComplete: () => {
        if (ripple.parentNode) {
          ripple.remove();
        }
      }
    });
  }

  // Méthode pour valider l'email
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
