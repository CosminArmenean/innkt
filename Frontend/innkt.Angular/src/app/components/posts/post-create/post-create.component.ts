import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { CreatePostRequest } from '../../../models/post';
import { PostsService } from '../../../services/posts.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-post-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatSelectModule,

    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './post-create.component.html',
  styleUrl: './post-create.component.scss'
})
export class PostCreateComponent implements OnDestroy {
  postForm: FormGroup;
  isLoading = false;
  selectedTags: string[] = [];
  availableTags = [
    'Angular', '.NET', 'Web Development', 'Mobile', 'AI', 'Cloud', 
    'DevOps', 'Database', 'Security', 'Testing', 'UI/UX', 'Performance'
  ];
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private postsService: PostsService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.postForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      content: ['', [Validators.required, Validators.minLength(20)]],
      category: ['', Validators.required],
      isPublic: [true]
    });
  }

  addTag(tag: string) {
    if (!this.selectedTags.includes(tag)) {
      this.selectedTags.push(tag);
    }
  }

  removeTag(tag: string) {
    this.selectedTags = this.selectedTags.filter(t => t !== tag);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit() {
    if (this.postForm.valid) {
      this.isLoading = true;
      
      const postData: CreatePostRequest = {
        title: this.postForm.value.title,
        content: this.postForm.value.content,
        tags: this.selectedTags,
        category: this.postForm.value.category,
        isPublished: this.postForm.value.isPublic
      };
      
      this.postsService.createPost(postData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (newPost) => {
            this.isLoading = false;
            this.snackBar.open('Post created successfully!', 'Close', { duration: 3000 });
            this.router.navigate(['/posts']);
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error creating post:', error);
            this.snackBar.open('Error creating post', 'Close', { duration: 5000 });
          }
        });
    }
  }

  onCancel() {
    this.router.navigate(['/posts']);
  }
}
