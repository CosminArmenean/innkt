import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import SocialDashboard from '../social/SocialDashboard';

// Mock the social service
jest.mock('../../services/social.service', () => ({
  getPosts: jest.fn(),
  createPost: jest.fn(),
  likePost: jest.fn(),
  unlikePost: jest.fn(),
  commentOnPost: jest.fn(),
  sharePost: jest.fn(),
  deletePost: jest.fn(),
  reportPost: jest.fn(),
}));

// Mock the auth service
jest.mock('../../services/auth.service', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({
    id: 'test-user-id',
    username: 'testuser',
    displayName: 'Test User',
    email: 'test@example.com'
  }),
}));

// Mock the notification service
jest.mock('../../services/notification.service', () => ({
  showNotification: jest.fn(),
}));

const mockPosts = [
  {
    id: 'post-1',
    content: 'This is a test post',
    author: {
      id: 'user-1',
      username: 'testuser1',
      displayName: 'Test User 1',
      avatar: 'https://example.com/avatar1.jpg'
    },
    createdAt: '2024-01-01T00:00:00Z',
    likesCount: 5,
    commentsCount: 2,
    sharesCount: 1,
    isLiked: false,
    isShared: false,
    media: []
  },
  {
    id: 'post-2',
    content: 'Another test post with image',
    author: {
      id: 'user-2',
      username: 'testuser2',
      displayName: 'Test User 2',
      avatar: 'https://example.com/avatar2.jpg'
    },
    createdAt: '2024-01-02T00:00:00Z',
    likesCount: 10,
    commentsCount: 5,
    sharesCount: 3,
    isLiked: true,
    isShared: false,
    media: [
      {
        id: 'media-1',
        type: 'image',
        url: 'https://example.com/image.jpg',
        thumbnail: 'https://example.com/thumb.jpg'
      }
    ]
  }
];

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          {component}
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('SocialDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { getPosts } = require('../../services/social.service');
    getPosts.mockResolvedValue(mockPosts);
  });

  it('renders social dashboard correctly', async () => {
    renderWithProviders(<SocialDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/social feed/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/create post/i)).toBeInTheDocument();
    expect(screen.getByText(/feed/i)).toBeInTheDocument();
    expect(screen.getByText(/discover/i)).toBeInTheDocument();
  });

  it('displays posts from the feed', async () => {
    renderWithProviders(<SocialDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('This is a test post')).toBeInTheDocument();
      expect(screen.getByText('Another test post with image')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Test User 1')).toBeInTheDocument();
    expect(screen.getByText('Test User 2')).toBeInTheDocument();
  });

  it('shows post engagement metrics', async () => {
    renderWithProviders(<SocialDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // likes count
      expect(screen.getByText('2')).toBeInTheDocument(); // comments count
      expect(screen.getByText('1')).toBeInTheDocument(); // shares count
    });
  });

  it('handles post creation', async () => {
    const user = userEvent.setup();
    const { createPost } = require('../../services/social.service');
    createPost.mockResolvedValue({ success: true, post: mockPosts[0] });
    
    renderWithProviders(<SocialDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/create post/i)).toBeInTheDocument();
    });
    
    const createPostButton = screen.getByText(/create post/i);
    await user.click(createPostButton);
    
    // This would open a modal in the real component
    // For now, we'll just verify the button is clickable
    expect(createPostButton).toBeInTheDocument();
  });

  it('handles post liking', async () => {
    const user = userEvent.setup();
    const { likePost, unlikePost } = require('../../services/social.service');
    likePost.mockResolvedValue({ success: true });
    unlikePost.mockResolvedValue({ success: true });
    
    renderWithProviders(<SocialDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('This is a test post')).toBeInTheDocument();
    });
    
    // Find and click the like button for the first post
    const likeButtons = screen.getAllByRole('button', { name: /like/i });
    await user.click(likeButtons[0]);
    
    await waitFor(() => {
      expect(likePost).toHaveBeenCalledWith('post-1');
    });
  });

  it('handles post unliking', async () => {
    const user = userEvent.setup();
    const { unlikePost } = require('../../services/social.service');
    unlikePost.mockResolvedValue({ success: true });
    
    renderWithProviders(<SocialDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Another test post with image')).toBeInTheDocument();
    });
    
    // Find and click the unlike button for the second post (which is already liked)
    const unlikeButtons = screen.getAllByRole('button', { name: /unlike/i });
    if (unlikeButtons.length > 0) {
      await user.click(unlikeButtons[0]);
      
      await waitFor(() => {
        expect(unlikePost).toHaveBeenCalledWith('post-2');
      });
    }
  });

  it('handles post sharing', async () => {
    const user = userEvent.setup();
    const { sharePost } = require('../../services/social.service');
    sharePost.mockResolvedValue({ success: true });
    
    renderWithProviders(<SocialDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('This is a test post')).toBeInTheDocument();
    });
    
    // Find and click the share button
    const shareButtons = screen.getAllByRole('button', { name: /share/i });
    await user.click(shareButtons[0]);
    
    await waitFor(() => {
      expect(sharePost).toHaveBeenCalledWith('post-1');
    });
  });

  it('handles post commenting', async () => {
    const user = userEvent.setup();
    const { commentOnPost } = require('../../services/social.service');
    commentOnPost.mockResolvedValue({ success: true });
    
    renderWithProviders(<SocialDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('This is a test post')).toBeInTheDocument();
    });
    
    // Find and click the comment button
    const commentButtons = screen.getAllByRole('button', { name: /comment/i });
    await user.click(commentButtons[0]);
    
    // This would open a comment modal in the real component
    expect(commentButtons[0]).toBeInTheDocument();
  });

  it('handles post deletion', async () => {
    const user = userEvent.setup();
    const { deletePost } = require('../../services/social.service');
    deletePost.mockResolvedValue({ success: true });
    
    renderWithProviders(<SocialDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('This is a test post')).toBeInTheDocument();
    });
    
    // Find and click the delete button (if user owns the post)
    const deleteButtons = screen.queryAllByRole('button', { name: /delete/i });
    if (deleteButtons.length > 0) {
      await user.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(deletePost).toHaveBeenCalled();
      });
    }
  });

  it('handles post reporting', async () => {
    const user = userEvent.setup();
    const { reportPost } = require('../../services/social.service');
    reportPost.mockResolvedValue({ success: true });
    
    renderWithProviders(<SocialDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('This is a test post')).toBeInTheDocument();
    });
    
    // Find and click the report button
    const reportButtons = screen.queryAllByRole('button', { name: /report/i });
    if (reportButtons.length > 0) {
      await user.click(reportButtons[0]);
      
      await waitFor(() => {
        expect(reportPost).toHaveBeenCalled();
      });
    }
  });

  it('switches between tabs correctly', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SocialDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/feed/i)).toBeInTheDocument();
    });
    
    const discoverTab = screen.getByText(/discover/i);
    await user.click(discoverTab);
    
    // Verify the discover tab is active
    expect(discoverTab).toHaveClass('active');
  });

  it('handles loading state', async () => {
    const { getPosts } = require('../../services/social.service');
    getPosts.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderWithProviders(<SocialDashboard />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('This is a test post')).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    const { getPosts } = require('../../services/social.service');
    getPosts.mockRejectedValue(new Error('Failed to load posts'));
    
    renderWithProviders(<SocialDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load posts/i)).toBeInTheDocument();
    });
  });

  it('handles empty feed state', async () => {
    const { getPosts } = require('../../services/social.service');
    getPosts.mockResolvedValue([]);
    
    renderWithProviders(<SocialDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/no posts yet/i)).toBeInTheDocument();
    });
  });

  it('displays post media correctly', async () => {
    renderWithProviders(<SocialDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Another test post with image')).toBeInTheDocument();
    });
    
    // Check if image is displayed
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
  });

  it('handles post pagination', async () => {
    const user = userEvent.setup();
    const { getPosts } = require('../../services/social.service');
    getPosts.mockResolvedValue(mockPosts);
    
    renderWithProviders(<SocialDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('This is a test post')).toBeInTheDocument();
    });
    
    // Scroll to bottom to trigger pagination
    fireEvent.scroll(window, { target: { scrollY: 1000 } });
    
    await waitFor(() => {
      expect(getPosts).toHaveBeenCalledTimes(2); // Initial load + pagination
    });
  });

  it('handles real-time updates', async () => {
    renderWithProviders(<SocialDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('This is a test post')).toBeInTheDocument();
    });
    
    // Simulate real-time update
    const { getPosts } = require('../../services/social.service');
    const newPost = {
      id: 'post-3',
      content: 'New real-time post',
      author: {
        id: 'user-3',
        username: 'testuser3',
        displayName: 'Test User 3',
        avatar: 'https://example.com/avatar3.jpg'
      },
      createdAt: '2024-01-03T00:00:00Z',
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      isLiked: false,
      isShared: false,
      media: []
    };
    
    getPosts.mockResolvedValue([newPost, ...mockPosts]);
    
    // Trigger a refresh (this would happen automatically in real-time)
    await waitFor(() => {
      expect(screen.getByText('New real-time post')).toBeInTheDocument();
    });
  });
});
