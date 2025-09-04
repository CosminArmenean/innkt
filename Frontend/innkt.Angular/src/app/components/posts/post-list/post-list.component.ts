import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { Post, PostFilters } from '../../../models/post';
import { PostsService } from '../../../services/posts.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    TranslateModule,
    RouterModule
  ],
  templateUrl: './post-list.component.html',
  styleUrl: './post-list.component.scss'
})
export class PostListComponent implements OnInit, OnDestroy {
  posts: Post[] = [];
  loading = false;
  pageSize = 10;
  currentPage = 0;
  totalPosts = 0;
  currentUser = this.authService.getCurrentUser();
  filters: PostFilters = {};
  private destroy$ = new Subject<void>();

  constructor(
    private postsService: PostsService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadPosts();
    
    // Subscribe to posts updates
    this.postsService.posts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(posts => {
        this.posts = posts;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPosts() {
    this.loading = true;
    
    this.postsService.getPosts(this.currentPage, this.pageSize, this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.totalPosts = response.totalCount;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading posts:', error);
          this.loading = false;
          this.snackBar.open('Error loading posts', 'Close', { duration: 3000 });
        }
      });
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPosts();
  }

  onLikePost(postId: string) {
    this.postsService.toggleLike(postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Post liked!', 'Close', { duration: 2000 });
        },
        error: (error) => {
          console.error('Error liking post:', error);
          this.snackBar.open('Error liking post', 'Close', { duration: 3000 });
        }
      });
  }

  onDeletePost(postId: string) {
    if (confirm('Are you sure you want to delete this post?')) {
      this.postsService.deletePost(postId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Post deleted successfully', 'Close', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error deleting post:', error);
            this.snackBar.open('Error deleting post', 'Close', { duration: 3000 });
          }
        });
    }
  }

  applyFilters(newFilters: PostFilters) {
    this.filters = { ...this.filters, ...newFilters };
    this.currentPage = 0;
    this.loadPosts();
  }

  commentPost(postId: string) {
    // TODO: Implement comment logic
    console.log('Commenting on post:', postId);
  }

  sharePost(postId: string) {
    // TODO: Implement share logic
    console.log('Sharing post:', postId);
  }
}
