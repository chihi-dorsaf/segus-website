import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  type: 'meeting' | 'deadline' | 'task' | 'other';
  description?: string;
}

@Component({
  selector: 'app-employee-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-calendar.component.html',
  styleUrls: ['./employee-calendar.component.css']
})
export class EmployeeCalendarComponent implements OnInit {
  currentDate = new Date();
  selectedDate = new Date();
  calendarDays: any[] = [];
  events: CalendarEvent[] = [];
  selectedEvents: CalendarEvent[] = [];
  
  months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  ngOnInit(): void {
    this.generateCalendar();
    this.loadEvents();
  }

  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    this.calendarDays = [];
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      this.calendarDays.push({
        date: date,
        day: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: this.isToday(date),
        isSelected: this.isSameDay(date, this.selectedDate),
        events: this.getEventsForDate(date)
      });
    }
  }

  loadEvents(): void {
    // Données d'exemple - à remplacer par un appel API
    this.events = [
      {
        id: 1,
        title: 'Réunion équipe',
        date: '2025-01-15',
        time: '09:00',
        type: 'meeting',
        description: 'Réunion hebdomadaire de l\'équipe'
      },
      {
        id: 2,
        title: 'Deadline projet Alpha',
        date: '2025-01-20',
        time: '17:00',
        type: 'deadline',
        description: 'Livraison finale du projet Alpha'
      },
      {
        id: 3,
        title: 'Formation Angular',
        date: '2025-01-18',
        time: '14:00',
        type: 'other',
        description: 'Session de formation sur Angular 17'
      }
    ];
    this.generateCalendar();
  }

  getEventsForDate(date: Date): CalendarEvent[] {
    const dateStr = date.toISOString().split('T')[0];
    return this.events.filter(event => event.date === dateStr);
  }

  selectDate(day: any): void {
    this.selectedDate = new Date(day.date);
    this.selectedEvents = day.events;
    this.generateCalendar();
  }

  previousMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.generateCalendar();
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.selectedDate = new Date();
    this.generateCalendar();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return this.isSameDay(date, today);
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  getEventTypeColor(type: string): string {
    switch (type) {
      case 'meeting': return 'primary';
      case 'deadline': return 'danger';
      case 'task': return 'warning';
      default: return 'info';
    }
  }

  getEventTypeIcon(type: string): string {
    switch (type) {
      case 'meeting': return 'fa-users';
      case 'deadline': return 'fa-exclamation-triangle';
      case 'task': return 'fa-tasks';
      default: return 'fa-calendar';
    }
  }
}
