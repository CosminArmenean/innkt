import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock window.location
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  },
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock fetch
global.fetch = jest.fn();

// Mock WebSocket
global.WebSocket = class WebSocket {
  constructor() {}
  close() {}
  send() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {}
};

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: {
    permission: 'granted',
    requestPermission: jest.fn().mockResolvedValue('granted'),
  },
});

// Mock Service Worker
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: jest.fn().mockResolvedValue({
      installing: null,
      waiting: null,
      active: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }),
    ready: Promise.resolve({
      installing: null,
      waiting: null,
      active: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }),
  },
});

// Mock Push API
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    ready: Promise.resolve({
      pushManager: {
        subscribe: jest.fn().mockResolvedValue({
          endpoint: 'https://example.com/push',
          keys: {
            p256dh: 'test-p256dh-key',
            auth: 'test-auth-key',
          },
        }),
        getSubscription: jest.fn().mockResolvedValue(null),
        unsubscribe: jest.fn().mockResolvedValue(true),
      },
    }),
  },
});

// Mock File API
global.File = class File {
  constructor(public name: string, public size: number, public type: string) {}
};

global.FileReader = class FileReader {
  result: string | null = null;
  error: Error | null = null;
  readyState: number = 0;
  onload: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onloadend: ((event: any) => void) | null = null;
  
  readAsDataURL() {
    setTimeout(() => {
      this.result = 'data:image/jpeg;base64,test-image-data';
      this.readyState = 2;
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    }, 0);
  }
  
  readAsText() {
    setTimeout(() => {
      this.result = 'test file content';
      this.readyState = 2;
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    }, 0);
  }
  
  abort() {}
};

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn().mockReturnValue('blob:http://localhost:3000/test-blob-url'),
});

// Mock URL.revokeObjectURL
Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn(),
});

// Mock crypto for WebRTC
Object.defineProperty(global, 'crypto', {
  writable: true,
  value: {
    randomUUID: jest.fn().mockReturnValue('test-uuid'),
    getRandomValues: jest.fn().mockImplementation((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

// Mock RTCPeerConnection for WebRTC tests
global.RTCPeerConnection = class RTCPeerConnection {
  constructor() {}
  createOffer() { return Promise.resolve({ type: 'offer', sdp: 'test-sdp' }); }
  createAnswer() { return Promise.resolve({ type: 'answer', sdp: 'test-sdp' }); }
  setLocalDescription() { return Promise.resolve(); }
  setRemoteDescription() { return Promise.resolve(); }
  addIceCandidate() { return Promise.resolve(); }
  close() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {}
};

// Mock MediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [],
      getVideoTracks: () => [],
      getAudioTracks: () => [],
    }),
    enumerateDevices: jest.fn().mockResolvedValue([]),
  },
});

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Reset localStorage and sessionStorage
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
  
  // Reset fetch mock
  (global.fetch as jest.Mock).mockClear();
  
  // Suppress console errors and warnings in tests unless explicitly needed
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toHaveTextContent(text: string): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveValue(value: string): R;
      toHaveAttribute(attr: string, value?: string): R;
    }
  }
}