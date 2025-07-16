import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { trigger, style, animate, transition, stagger, query } from '@angular/animations';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  tag: string;
  slug: string;
  readTime: number;
}

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css'],
  animations: [
    trigger('slideInLeft', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-50px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerIn', [
      transition(':enter', [
        query('.blog-post', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(100, [
            animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class BlogComponent implements OnInit {
  posts: BlogPost[] = [
    {
      id: 1,
      title: 'AI Trends 2025',
      excerpt: 'Découvrez les dernières avancées en intelligence artificielle.',
      date: '2025-07-15',
      image: 'assets/img/ai.jpg',
      tag: 'AI',
      slug: 'ai-trends-2025',
      readTime: 5
    },
    {
      id: 2,
      title: 'Engineering Innovations',
      excerpt: 'Nouvelles techniques en ingénierie pour l’avenir.',
      date: '2025-07-12',
      image: 'assets/img/engineering.jpg',
      tag: 'Engineering',
      slug: 'engineering-innovations',
      readTime: 6
    },
    {
      id: 3,
      title: 'Marketing Strategies',
      excerpt: 'Conseils pour un marketing numérique efficace.',
      date: '2025-07-10',
      image: 'assets/img/marketing.jpg',
      tag: 'Marketing',
      slug: 'marketing-strategies',
      readTime: 4
    },



  ];

  availableTags: string[] = ['All', 'AI', 'Engineering', 'Marketing'];
  selectedTag: string = 'All';
  visiblePosts: BlogPost[] = [];
  filteredPosts: BlogPost[] = [];
  currentPage: number = 1;
  postsPerPage: number = 6;
  totalPages: number = 1;
  isLoading: boolean = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.filterPosts();
  }

  onTagChange(tag: string): void {
    this.selectedTag = tag;
    this.currentPage = 1;
    this.filterPosts();
  }

  filterPosts(): void {
    this.isLoading = true;
    setTimeout(() => {
      this.filteredPosts = this.selectedTag === 'All'
        ? [...this.posts]
        : this.posts.filter(post => post.tag === this.selectedTag);
      this.totalPages = Math.ceil(this.filteredPosts.length / this.postsPerPage);
      this.updateVisiblePosts();
      this.isLoading = false;
      this.cdr.detectChanges();
    }, 500);
  }

  updateVisiblePosts(): void {
    const start = (this.currentPage - 1) * this.postsPerPage;
    const end = start + this.postsPerPage;
    this.visiblePosts = this.filteredPosts.slice(0, end);
  }

  loadMorePosts(): void {
    this.currentPage++;
    this.updateVisiblePosts();
    this.cdr.detectChanges();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateVisiblePosts();
      this.cdr.detectChanges();
    }
  }

  getTagDisplayName(tag: string): string {
    return tag === 'All' ? 'Tous' : tag;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getReadTimeText(readTime: number): string {
    return `${readTime} min de lecture`;
  }

  trackByPostId(index: number, post: BlogPost): number {
    return post.id;
  }
}
