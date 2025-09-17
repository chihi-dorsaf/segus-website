import { trigger, state, style, transition, animate, keyframes, query, stagger } from '@angular/animations';

export const workHoursAnimations = [
  // Animation pour les cartes de session
  trigger('cardAnimation', [
    state('idle', style({
      transform: 'scale(1)',
      opacity: 1
    })),
    state('start', style({
      transform: 'scale(1.05)',
      opacity: 1
    })),
    state('pause', style({
      transform: 'scale(0.98)',
      opacity: 0.9
    })),
    state('resume', style({
      transform: 'scale(1.02)',
      opacity: 1
    })),
    state('end', style({
      transform: 'scale(0.95)',
      opacity: 0.8
    })),
    transition('* => start', [
      animate('500ms ease-out', keyframes([
        style({ transform: 'scale(1)', opacity: 1, offset: 0 }),
        style({ transform: 'scale(1.1)', opacity: 1, offset: 0.5 }),
        style({ transform: 'scale(1.05)', opacity: 1, offset: 1 })
      ]))
    ]),
    transition('* => pause', [
      animate('600ms ease-out', keyframes([
        style({ transform: 'scale(1)', offset: 0 }),
        style({ transform: 'scale(0.9)', offset: 0.3 }),
        style({ transform: 'scale(1.05)', offset: 0.6 }),
        style({ transform: 'scale(0.98)', offset: 1 })
      ]))
    ]),
    transition('* => resume', [
      animate('500ms ease-out', keyframes([
        style({ transform: 'scale(0.98)', opacity: 0.9, offset: 0 }),
        style({ transform: 'scale(1.05)', opacity: 1, offset: 0.5 }),
        style({ transform: 'scale(1.02)', opacity: 1, offset: 1 })
      ]))
    ]),
    transition('* => end', [
      animate('500ms ease-out', keyframes([
        style({ transform: 'scale(1)', opacity: 1, offset: 0 }),
        style({ transform: 'scale(0.9)', opacity: 0.8, offset: 0.7 }),
        style({ transform: 'scale(0.95)', opacity: 0.8, offset: 1 })
      ]))
    ]),
    transition('* => idle', [
      animate('300ms ease-out')
    ])
  ]),

  // Animation pour les notifications
  trigger('slideInOut', [
    transition(':enter', [
      style({ transform: 'translateX(100%)', opacity: 0 }),
      animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
    ]),
    transition(':leave', [
      animate('300ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
    ])
  ]),

  // Animation pour les éléments de la liste
  trigger('fadeInUp', [
    transition(':enter', [
      style({ transform: 'translateY(20px)', opacity: 0 }),
      animate('400ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
    ])
  ]),

  // Animation pour les statistiques
  trigger('statCardAnimation', [
    transition(':enter', [
      query('.stat-card', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        stagger(100, [
          animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
        ])
      ])
    ])
  ]),

  // Animation pour le timer
  trigger('timerPulse', [
    state('running', style({
      transform: 'scale(1)',
      boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
    })),
    state('pulse', style({
      transform: 'scale(1.05)',
      boxShadow: '0 0 30px rgba(16, 185, 129, 0.5)'
    })),
    transition('running => pulse', [
      animate('1000ms ease-in-out')
    ]),
    transition('pulse => running', [
      animate('1000ms ease-in-out')
    ])
  ]),

  // Animation pour les modales
  trigger('modalAnimation', [
    transition(':enter', [
      style({ opacity: 0, transform: 'scale(0.8)' }),
      animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
    ]),
    transition(':leave', [
      animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.8)' }))
    ])
  ]),

  // Animation pour les boutons
  trigger('buttonHover', [
    state('normal', style({
      transform: 'translateY(0)',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
    })),
    state('hovered', style({
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
    })),
    transition('normal => hovered', [
      animate('200ms ease-out')
    ]),
    transition('hovered => normal', [
      animate('200ms ease-in')
    ])
  ]),

  // Animation pour les lignes du tableau
  trigger('tableRowAnimation', [
    transition(':enter', [
      query('td', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        stagger(50, [
          animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
        ])
      ])
    ]),
    transition(':leave', [
      query('td', [
        stagger(50, [
          animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(20px)' }))
        ])
      ])
    ])
  ]),

  // Animation pour les filtres
  trigger('filterAnimation', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(-10px)' }),
      animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
    ]),
    transition(':leave', [
      animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
    ])
  ]),

  // Animation pour la pagination
  trigger('paginationAnimation', [
    transition('* => *', [
      query('.page-item', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        stagger(50, [
          animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
        ])
      ])
    ])
  ]),

  // Animation pour les icônes
  trigger('iconAnimation', [
    transition('* => *', [
      animate('200ms ease-out', keyframes([
        style({ transform: 'rotate(0deg)', offset: 0 }),
        style({ transform: 'rotate(10deg)', offset: 0.5 }),
        style({ transform: 'rotate(0deg)', offset: 1 })
      ]))
    ])
  ]),

  // Animation pour le loading
  trigger('loadingAnimation', [
    transition(':enter', [
      style({ opacity: 0 }),
      animate('300ms ease-out', style({ opacity: 1 }))
    ]),
    transition(':leave', [
      animate('200ms ease-in', style({ opacity: 0 }))
    ])
  ]),

  // Animation pour les barres de progression
  trigger('progressAnimation', [
    transition('* => *', [
      animate('800ms ease-out')
    ])
  ]),

  // Animation pour les messages d'erreur
  trigger('errorAnimation', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateX(-100%)' }),
      animate('400ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
    ]),
    transition(':leave', [
      animate('300ms ease-in', style({ opacity: 0, transform: 'translateX(-100%)' }))
    ])
  ]),

  // Animation pour les tooltips
  trigger('tooltipAnimation', [
    transition(':enter', [
      style({ opacity: 0, transform: 'scale(0.8) translateY(10px)' }),
      animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
    ]),
    transition(':leave', [
      animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.8) translateY(10px)' }))
    ])
  ]),

  // Animation pour les transitions de page
  trigger('pageTransition', [
    transition('* => *', [
      query(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ], { optional: true }),
      query(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ], { optional: true })
    ])
  ])
];

// Animation pour les éléments qui apparaissent en séquence
export const staggerAnimation = trigger('staggerAnimation', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(20px)' }),
      stagger(100, [
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ], { optional: true })
  ])
]);

// Animation pour les éléments qui disparaissent en séquence
export const staggerOutAnimation = trigger('staggerOutAnimation', [
  transition('* => *', [
    query(':leave', [
      stagger(50, [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ], { optional: true })
  ])
]);

// Animation pour les éléments qui se déplacent
export const slideAnimation = trigger('slideAnimation', [
  state('left', style({ transform: 'translateX(-100%)' })),
  state('center', style({ transform: 'translateX(0)' })),
  state('right', style({ transform: 'translateX(100%)' })),
  transition('left <=> center', animate('400ms ease-in-out')),
  transition('center <=> right', animate('400ms ease-in-out')),
  transition('left <=> right', animate('600ms ease-in-out'))
]);

// Animation pour les éléments qui changent de taille
export const sizeAnimation = trigger('sizeAnimation', [
  state('small', style({ transform: 'scale(0.8)' })),
  state('normal', style({ transform: 'scale(1)' })),
  state('large', style({ transform: 'scale(1.2)' })),
  transition('small <=> normal', animate('300ms ease-in-out')),
  transition('normal <=> large', animate('300ms ease-in-out')),
  transition('small <=> large', animate('500ms ease-in-out'))
]);

// Animation pour les éléments qui changent de couleur
export const colorAnimation = trigger('colorAnimation', [
  transition('* => *', [
    animate('500ms ease-in-out')
  ])
]);

// Animation pour les éléments qui tournent
export const rotateAnimation = trigger('rotateAnimation', [
  state('normal', style({ transform: 'rotate(0deg)' })),
  state('rotated', style({ transform: 'rotate(360deg)' })),
  transition('normal => rotated', [
    animate('1000ms ease-in-out')
  ]),
  transition('rotated => normal', [
    animate('0ms')
  ])
]);

// Animation pour les éléments qui rebondissent
export const bounceAnimation = trigger('bounceAnimation', [
  transition('* => *', [
    animate('600ms ease-out', keyframes([
      style({ transform: 'translate3d(0, 0, 0)', offset: 0 }),
      style({ transform: 'translate3d(0, -10px, 0)', offset: 0.2 }),
      style({ transform: 'translate3d(0, 0, 0)', offset: 0.4 }),
      style({ transform: 'translate3d(0, -5px, 0)', offset: 0.6 }),
      style({ transform: 'translate3d(0, 0, 0)', offset: 1 })
    ]))
  ])
]);

// Animation pour les éléments qui clignotent
export const blinkAnimation = trigger('blinkAnimation', [
  transition('* => *', [
    animate('1000ms ease-in-out', keyframes([
      style({ opacity: 1, offset: 0 }),
      style({ opacity: 0.3, offset: 0.5 }),
      style({ opacity: 1, offset: 1 })
    ]))
  ])
]);
