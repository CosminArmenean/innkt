export interface Post {
  id: string;
  title: string;
  content: string;
  author: PostAuthor;
  createdAt: Date;
  updatedAt?: Date;
  likes: number;
  comments: number;
  tags: string[];
  isPublished: boolean;
  category?: string;
  featuredImage?: string;
}

export interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  username?: string;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  tags: string[];
  category?: string;
  featuredImage?: string;
  isPublished?: boolean;
}

export interface UpdatePostRequest extends Partial<CreatePostRequest> {
  id: string;
}

export interface PostListResponse {
  posts: Post[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export interface PostFilters {
  category?: string;
  tags?: string[];
  authorId?: string;
  isPublished?: boolean;
  searchTerm?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'likes' | 'comments' | 'title';
  sortOrder?: 'asc' | 'desc';
}






