import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';

import { User, UserStats } from '../../models/user';
import { Post } from '../../models/post';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { PostsService } from '../../services/posts.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,

    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  userId: string = '';
  user: User | null = null;
  isOwnProfile: boolean = false;
  posts: Post[] = [];
  followers: User[] = [];
  following: User[] = [];
  userStats: UserStats | null = null;
  loading = false;
  isFollowing = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private userService: UserService,
    private postsService: PostsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.userId = params['id'];
      this.loadProfile();
      this.loadPosts();
      this.loadFollowers();
      this.loadFollowing();
      this.checkFollowStatus();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProfile() {
    this.loading = true;
    this.userService.getUserProfile(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.user = user;
          this.isOwnProfile = this.userId === this.authService.getCurrentUser()?.id;
          this.loadUserStats();
        },
        error: (error) => {
          console.error('Error loading profile:', error);
          this.snackBar.open('Error loading profile', 'Close', { duration: 3000 });
        }
      });
  }

  private loadUserStats() {
    this.userService.getUserStats(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.userStats = stats;
        },
        error: (error) => {
          console.error('Error loading user stats:', error);
        }
      });
  }

  private loadPosts() {
    this.postsService.getUserPosts(this.userId, 0, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.posts = response.posts;
        },
        error: (error) => {
          console.error('Error loading posts:', error);
          this.snackBar.open('Error loading posts', 'Close', { duration: 3000 });
        }
      });
  }

  private loadFollowers() {
    this.userService.getUserFollowers(this.userId, 0, 20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.followers = response.users;
        },
        error: (error) => {
          console.error('Error loading followers:', error);
        }
      });
  }

  private loadFollowing() {
    this.userService.getUserFollowing(this.userId, 0, 20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.following = response.users;
        },
        error: (error) => {
          console.error('Error loading following:', error);
        }
      });
  }

  private checkFollowStatus() {
    if (!this.isOwnProfile && this.authService.getCurrentUser()) {
      const currentUserId = this.authService.getCurrentUser()!.id;
      this.userService.isFollowing(currentUserId, this.userId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (isFollowing) => {
            this.isFollowing = isFollowing;
          },
          error: (error) => {
            console.error('Error checking follow status:', error);
          }
        });
    }
  }

  followUser() {
    if (!this.authService.getCurrentUser()) {
      this.snackBar.open('Please log in to follow users', 'Close', { duration: 3000 });
      return;
    }

    const currentUserId = this.authService.getCurrentUser()!.id;
    this.userService.followUser(currentUserId, this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isFollowing = true;
          this.snackBar.open('Successfully followed user!', 'Close', { duration: 2000 });
          this.loadFollowers(); // Refresh followers count
        },
        error: (error) => {
          console.error('Error following user:', error);
          this.snackBar.open('Error following user', 'Close', { duration: 3000 });
        }
      });
  }

  unfollowUser() {
    if (!this.authService.getCurrentUser()) {
      this.snackBar.open('Please log in to unfollow users', 'Close', { duration: 3000 });
      return;
    }

    const currentUserId = this.authService.getCurrentUser()!.id;
    this.userService.unfollowUser(currentUserId, this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isFollowing = false;
          this.snackBar.open('Successfully unfollowed user!', 'Close', { duration: 2000 });
          this.loadFollowers(); // Refresh followers count
        },
        error: (error) => {
          console.error('Error unfollowing user:', error);
          this.snackBar.open('Error unfollowing user', 'Close', { duration: 3000 });
        }
      });
  }
}
