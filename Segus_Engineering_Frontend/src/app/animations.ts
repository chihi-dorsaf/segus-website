import { trigger, state, style, transition, animate } from '@angular/animations';

export const fadeInAnimation = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(20px)' }),
    animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

export const slideInAnimation = trigger('slideIn', [
  transition(':enter', [
    style({ transform: 'translateX(-100%)' }),
    animate('300ms ease-out', style({ transform: 'translateX(0)' }))
  ])
]);

export const scaleAnimation = trigger('scale', [
  state('normal', style({ transform: 'scale(1)' })),
  state('scaled', style({ transform: 'scale(1.05)' })),
  transition('normal <=> scaled', animate('200ms ease-in-out'))
]);








