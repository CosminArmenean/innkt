import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { Post, PostFilters } from '../../models/post';
import { User } from '../../models/user';
import { PostsService } from '../../services/posts.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatTabsModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatSelectModule,
    TranslateModule,
    RouterModule
  ],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent implements OnInit, OnDestroy {
  searchForm: FormGroup;
  activeTab = 0;
  
  // Posts search
  posts: Post[] = [];
  postsLoading = false;
  postsPage = 0;
  postsPageSize = 10;
  postsTotal = 0;
  
  // Users search
  users: User[] = [];
  usersLoading = false;
  usersPage = 0;
  usersPageSize = 20;
  usersTotal = 0;
  
  // Search filters
  postFilters: PostFilters = {};
  searchQuery = '';
  
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private postsService: PostsService,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.searchForm = this.fb.group({
      query: ['', []],
      category: [''],
      tags: [''],
      sortBy: ['createdAt'],
      sortOrder: ['desc']
    });
  }

  ngOnInit() {
    // Setup debounced search
    this.searchSubject$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(query => {
        this.searchQuery = query;
        this.performSearch();
      });

    // Watch form changes
    this.searchForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.searchSubject$.next(this.searchForm.get('query')?.value || '');
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTabChange(index: number) {
    this.activeTab = index;
    if (this.searchQuery) {
      this.performSearch();
    }
  }

  onPostsPageChange(event: PageEvent) {
    this.postsPage = event.pageIndex;
    this.postsPageSize = event.pageSize;
    this.searchPosts();
  }

  onUsersPageChange(event: PageEvent) {
    this.usersPage = event.pageIndex;
    this.usersPageSize = event.pageSize;
    this.searchUsers();
  }

  performSearch() {
    if (this.activeTab === 0) {
      this.searchPosts();
    } else {
      this.searchUsers();
    }
  }

  private searchPosts() {
    if (!this.searchQuery.trim()) {
      this.posts = [];
      this.postsTotal = 0;
      return;
    }

    this.postsLoading = true;
    
    // Update filters from form
    this.postFilters = {
      searchTerm: this.searchQuery,
      category: this.searchForm.get('category')?.value || undefined,
      tags: this.searchForm.get('tags')?.value ? [this.searchForm.get('tags')?.value] : undefined,
      sortBy: this.searchForm.get('sortBy')?.value || 'createdAt',
      sortOrder: this.searchForm.get('sortOrder')?.value || 'desc'
    };

    this.postsService.searchPosts(
      this.searchQuery,
      this.postsPage,
      this.postsPageSize
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.posts = response.posts;
          this.postsTotal = response.totalCount;
          this.postsLoading = false;
        },
        error: (error) => {
          console.error('Error searching posts:', error);
          this.postsLoading = false;
          this.snackBar.open('Error searching posts', 'Close', { duration: 3000 });
        }
      });
  }

  private searchUsers() {
    if (!this.searchQuery.trim()) {
      this.users = [];
      this.usersTotal = 0;
      return;
    }

    this.usersLoading = true;

    this.userService.searchUsers(
      this.searchQuery,
      this.usersPage,
      this.usersPageSize
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.users = response.users;
          this.usersTotal = response.totalCount;
          this.usersLoading = false;
        },
        error: (error) => {
          console.error('Error searching users:', error);
          this.usersLoading = false;
          this.snackBar.open('Error searching users', 'Close', { duration: 3000 });
        }
      });
  }

  clearSearch() {
    this.searchForm.reset({
      query: '',
      category: '',
      tags: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    this.posts = [];
    this.users = [];
    this.postsTotal = 0;
    this.usersTotal = 0;
    this.postsPage = 0;
    this.usersPage = 0;
  }
}

