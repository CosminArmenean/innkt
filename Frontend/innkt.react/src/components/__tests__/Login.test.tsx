import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import Login from '../auth/Login';

// Mock the auth service
jest.mock('../../services/auth.service', () => ({
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  getCurrentUser: jest.fn(),
}));

// Mock the notification service
jest.mock('../../services/notification.service', () => ({
  showNotification: jest.fn(),
}));

// Mock the router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, '123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const { login } = require('../../services/auth.service');
    login.mockResolvedValue({ success: true, token: 'test-token' });
    
    renderWithProviders(<Login />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'SecurePassword123!');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'SecurePassword123!'
      });
    });
  });

  it('shows error message on login failure', async () => {
    const user = userEvent.setup();
    const { login } = require('../../services/auth.service');
    login.mockRejectedValue(new Error('Invalid credentials'));
    
    renderWithProviders(<Login />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'SecurePassword123!');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during login', async () => {
    const user = userEvent.setup();
    const { login } = require('../../services/auth.service');
    login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderWithProviders(<Login />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'SecurePassword123!');
    await user.click(submitButton);
    
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('navigates to register page when clicking register link', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);
    
    const registerLink = screen.getByText(/sign up/i);
    await user.click(registerLink);
    
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  it('navigates to forgot password page when clicking forgot password link', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);
    
    const forgotPasswordLink = screen.getByText(/forgot password/i);
    await user.click(forgotPasswordLink);
    
    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Tab navigation
    await user.tab();
    expect(usernameInput).toHaveFocus();
    
    await user.tab();
    expect(passwordInput).toHaveFocus();
    
    await user.tab();
    expect(submitButton).toHaveFocus();
  });

  it('submits form on Enter key press', async () => {
    const user = userEvent.setup();
    const { login } = require('../../services/auth.service');
    login.mockResolvedValue({ success: true, token: 'test-token' });
    
    renderWithProviders(<Login />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'SecurePassword123!');
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'SecurePassword123!'
      });
    });
  });

  it('clears form when switching between login and register', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password');
    
    const registerLink = screen.getByText(/sign up/i);
    await user.click(registerLink);
    
    // Navigate back to login
    const loginLink = screen.getByText(/sign in/i);
    await user.click(loginLink);
    
    expect(usernameInput).toHaveValue('');
    expect(passwordInput).toHaveValue('');
  });

  it('shows success message on successful login', async () => {
    const user = userEvent.setup();
    const { login } = require('../../services/auth.service');
    const { showNotification } = require('../../services/notification.service');
    login.mockResolvedValue({ success: true, token: 'test-token' });
    
    renderWithProviders(<Login />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'SecurePassword123!');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(showNotification).toHaveBeenCalledWith(
        'Login successful!',
        'success'
      );
    });
  });

  it('handles network errors gracefully', async () => {
    const user = userEvent.setup();
    const { login } = require('../../services/auth.service');
    login.mockRejectedValue(new Error('Network error'));
    
    renderWithProviders(<Login />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'SecurePassword123!');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});
