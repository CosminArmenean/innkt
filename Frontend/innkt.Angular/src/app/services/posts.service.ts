import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Post, CreatePostRequest, UpdatePostRequest, PostListResponse, PostFilters } from '../models/post';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  private readonly API_BASE_URL = 'https://localhost:5002/api'; // Frontier service
  private postsSubject = new BehaviorSubject<Post[]>([]);
  private currentPostSubject = new BehaviorSubject<Post | null>(null);

  public posts$ = this.postsSubject.asObservable();
  public currentPost$ = this.currentPostSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Get posts with pagination and filters
  getPosts(page: number = 0, pageSize: number = 10, filters?: PostFilters): Observable<PostListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (filters) {
      if (filters.category) params = params.set('category', filters.category);
      if (filters.tags && filters.tags.length > 0) params = params.set('tags', filters.tags.join(','));
      if (filters.authorId) params = params.set('authorId', filters.authorId);
      if (filters.isPublished !== undefined) params = params.set('isPublished', filters.isPublished.toString());
      if (filters.searchTerm) params = params.set('searchTerm', filters.searchTerm);
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    }

    return this.http.get<PostListResponse>(`${this.API_BASE_URL}/v2/mongoposts/feed`, { params })
      .pipe(
        tap(response => {
          this.postsSubject.next(response.posts);
        })
      );
  }

  // Get a single post by ID
  getPost(id: string): Observable<Post> {
    return this.http.get<Post>(`${this.API_BASE_URL}/v2/mongoposts/${id}`)
      .pipe(
        tap(post => {
          this.currentPostSubject.next(post);
        })
      );
  }

  // Create a new post
  createPost(postData: CreatePostRequest): Observable<Post> {
    return this.http.post<Post>(`${this.API_BASE_URL}/v2/mongoposts`, postData)
      .pipe(
        tap(newPost => {
          const currentPosts = this.postsSubject.value;
          this.postsSubject.next([newPost, ...currentPosts]);
        })
      );
  }

  // Update an existing post
  updatePost(id: string, updates: UpdatePostRequest): Observable<Post> {
    return this.http.put<Post>(`${this.API_BASE_URL}/v2/mongoposts/${id}`, updates)
      .pipe(
        tap(updatedPost => {
          const currentPosts = this.postsSubject.value;
          const updatedPosts = currentPosts.map(post => 
            post.id === id ? updatedPost : post
          );
          this.postsSubject.next(updatedPosts);
          
          if (this.currentPostSubject.value?.id === id) {
            this.currentPostSubject.next(updatedPost);
          }
        })
      );
  }

  // Delete a post
  deletePost(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE_URL}/v2/mongoposts/${id}`)
      .pipe(
        tap(() => {
          const currentPosts = this.postsSubject.value;
          const filteredPosts = currentPosts.filter(post => post.id !== id);
          this.postsSubject.next(filteredPosts);
          
          if (this.currentPostSubject.value?.id === id) {
            this.currentPostSubject.next(null);
          }
        })
      );
  }

  // Like/unlike a post
  toggleLike(postId: string): Observable<Post> {
    return this.http.post<Post>(`${this.API_BASE_URL}/v2/mongoposts/${postId}/like`, {})
      .pipe(
        tap(updatedPost => {
          const currentPosts = this.postsSubject.value;
          const updatedPosts = currentPosts.map(post => 
            post.id === postId ? updatedPost : post
          );
          this.postsSubject.next(updatedPosts);
          
          if (this.currentPostSubject.value?.id === postId) {
            this.currentPostSubject.next(updatedPost);
          }
        })
      );
  }

  // Get posts by user
  getUserPosts(userId: string, page: number = 0, pageSize: number = 10): Observable<PostListResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<PostListResponse>(`${this.API_BASE_URL}/v2/mongoposts/user/${userId}`, { params });
  }

  // Get trending posts
  getTrendingPosts(limit: number = 10): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.API_BASE_URL}/v2/mongoposts/public`, {
      params: new HttpParams().set('limit', limit.toString())
    });
  }

  // Search posts
  searchPosts(query: string, page: number = 0, pageSize: number = 10): Observable<PostListResponse> {
    const params = new HttpParams()
      .set('q', query)
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<PostListResponse>(`${this.API_BASE_URL}/v2/mongoposts/search`, { params });
  }

  // Clear current post
  clearCurrentPost(): void {
    this.currentPostSubject.next(null);
  }

  // Get posts from cache
  getCachedPosts(): Post[] {
    return this.postsSubject.value;
  }

  // Get current post from cache
  getCachedCurrentPost(): Post | null {
    return this.currentPostSubject.value;
  }
}






