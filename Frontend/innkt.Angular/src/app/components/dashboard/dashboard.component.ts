import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { User } from '../../models/user';
import { UserStats } from '../../models/user';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { PostsService } from '../../services/posts.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    TranslateModule,
    RouterModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  stats: UserStats = {
    posts: 0,
    followers: 0,
    following: 0,
    likes: 0,
    comments: 0
  };
  recentPosts: any[] = [];
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private postsService: PostsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadStats();
    this.loadRecentPosts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadStats() {
    if (this.currentUser) {
      this.userService.getUserStats(this.currentUser.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (stats) => {
            this.stats = stats;
          },
          error: (error) => {
            console.error('Error loading user stats:', error);
            this.snackBar.open('Error loading user statistics', 'Close', { duration: 3000 });
          }
        });
    }
  }

  private loadRecentPosts() {
    if (this.currentUser) {
      this.loading = true;
      this.postsService.getUserPosts(this.currentUser.id, 0, 5)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.recentPosts = response.posts;
            this.loading = false;
          },
          error: (error) => {
            console.error('Error loading recent posts:', error);
            this.loading = false;
            this.snackBar.open('Error loading recent posts', 'Close', { duration: 3000 });
          }
        });
    }
  }
}
