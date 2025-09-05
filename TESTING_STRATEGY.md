# INNKT Application Testing Strategy

## Overview
This document outlines the comprehensive testing strategy for the INNKT social application, covering all layers from frontend to backend, and including automated testing, manual testing, and performance testing.

## Testing Pyramid

```
                    E2E Tests (Few)
                   /              \
                  /                \
                 /                  \
            Integration Tests (Some)
           /                        \
          /                          \
         /                            \
    Unit Tests (Many)
```

## 1. Unit Testing

### 1.1 Frontend Unit Tests (Angular)

#### Test Framework
- **Framework**: Jasmine + Karma
- **Coverage**: Istanbul
- **Configuration**: `karma.conf.js`

#### Test Structure
```typescript
// Example: auth.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should authenticate user with valid credentials', () => {
    const credentials = { email: 'test@example.com', password: 'password' };
    const mockResponse = { token: 'mock-token', user: { id: '1', email: 'test@example.com' } };

    service.login(credentials).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });
});
```

#### Components to Test
- [ ] Authentication components (login, register)
- [ ] Dashboard components
- [ ] Post management components
- [ ] User profile components
- [ ] Chat components
- [ ] Search components
- [ ] Shared components (navbar, footer)

#### Services to Test
- [ ] AuthService
- [ ] PostsService
- [ ] UserService
- [ ] ChatService
- [ ] NotificationService
- [ ] Interceptors

#### Test Commands
```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test -- --include="**/auth.service.spec.ts"
```

### 1.2 Backend Unit Tests (.NET)

#### Test Framework
- **Framework**: xUnit
- **Mocking**: Moq
- **Configuration**: `*.csproj`

#### Test Structure
```csharp
// Example: AuthControllerTests.cs
public class AuthControllerTests
{
    private readonly Mock<IAuthService> _authServiceMock;
    private readonly Mock<ILogger<AuthController>> _loggerMock;
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        _authServiceMock = new Mock<IAuthService>();
        _loggerMock = new Mock<ILogger<AuthController>>();
        _controller = new AuthController(_authServiceMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsOkResult()
    {
        // Arrange
        var loginRequest = new LoginRequest { Email = "test@example.com", Password = "password" };
        var expectedResponse = new AuthResponse { Token = "mock-token", User = new UserDto() };
        
        _authServiceMock.Setup(x => x.LoginAsync(loginRequest))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.Login(loginRequest);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<AuthResponse>(okResult.Value);
        Assert.Equal(expectedResponse.Token, response.Token);
    }
}
```

#### Test Commands
```bash
# Run all tests
dotnet test

# Run tests with coverage
dotnet test --collect:"XPlat Code Coverage"

# Run specific test project
dotnet test Backend/Services/Officer.IdentityService.Tests/

# Run tests in watch mode
dotnet watch test
```

### 1.3 Mobile Unit Tests (React Native)

#### Test Framework
- **Framework**: Jest
- **Mocking**: Jest mocks
- **Configuration**: `jest.config.js`

#### Test Structure
```typescript
// Example: auth.service.test.ts
import { AuthService } from '../src/services/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should store token after successful login', async () => {
    const mockToken = 'mock-jwt-token';
    const mockUser = { id: '1', email: 'test@example.com' };

    await AuthService.login('test@example.com', 'password');

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('auth_token', mockToken);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('current_user', JSON.stringify(mockUser));
  });
});
```

## 2. Integration Testing

### 2.1 API Integration Tests

#### Test Framework
- **Framework**: Postman Collections + Newman (CLI)
- **Database**: Test containers
- **Configuration**: `postman/` directory

#### Test Structure
```json
{
  "info": {
    "name": "INNKT API Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "User Registration",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\",\n  \"firstName\": \"John\",\n  \"lastName\": \"Doe\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/auth/register",
              "host": ["{{baseUrl}}"],
              "path": ["api", "auth", "register"]
            }
          },
          "response": []
        }
      ]
    }
  ]
}
```

#### Test Commands
```bash
# Run Postman collection
newman run postman/INNKT_API_Tests.postman_collection.json \
  --environment postman/environment.json \
  --reporters cli,json \
  --reporter-json-export results/api-tests.json
```

### 2.2 Database Integration Tests

#### Test Framework
- **Framework**: xUnit + TestContainers
- **Database**: MySQL, MongoDB containers

#### Test Structure
```csharp
public class UserRepositoryTests : IClassFixture<DatabaseFixture>
{
    private readonly DatabaseFixture _fixture;

    public UserRepositoryTests(DatabaseFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task CreateUser_ShouldPersistToDatabase()
    {
        // Arrange
        var user = new User { Email = "test@example.com", FirstName = "John" };
        var repository = new UserRepository(_fixture.DbContext);

        // Act
        var result = await repository.CreateAsync(user);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.Id);
        
        var savedUser = await repository.GetByIdAsync(result.Id);
        Assert.Equal(user.Email, savedUser.Email);
    }
}
```

## 3. End-to-End Testing

### 3.1 Frontend E2E Tests

#### Test Framework
- **Framework**: Playwright
- **Configuration**: `playwright.config.ts`

#### Test Structure
```typescript
// Example: auth.e2e.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can register and login', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    
    // Fill registration form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill('[data-testid="firstName-input"]', 'John');
    await page.fill('[data-testid="lastName-input"]', 'Doe');
    
    // Submit form
    await page.click('[data-testid="register-button"]');
    
    // Verify redirect to login
    await expect(page).toHaveURL('/login');
    
    // Login with created account
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Verify successful login
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
});
```

#### Test Commands
```bash
# Install Playwright
npx playwright install

# Run E2E tests
npm run test:e2e

# Run tests in headed mode
npm run test:e2e -- --headed

# Generate test report
npm run test:e2e -- --reporter=html
```

### 3.2 Mobile E2E Tests

#### Test Framework
- **Framework**: Detox
- **Configuration**: `.detoxrc.js`

#### Test Structure
```typescript
// Example: auth.e2e.js
describe('Authentication', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show login screen', async () => {
    await expect(element(by.id('login-screen'))).toBeVisible();
    await expect(element(by.id('email-input'))).toBeVisible();
    await expect(element(by.id('password-input'))).toBeVisible();
  });

  it('should login successfully', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    
    await expect(element(by.id('dashboard-screen'))).toBeVisible();
  });
});
```

## 4. Performance Testing

### 4.1 Load Testing

#### Test Framework
- **Framework**: Artillery
- **Configuration**: `artillery.yml`

#### Test Structure
```yaml
# Example: load-test.yml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"

scenarios:
  - name: "API Endpoints"
    weight: 70
    flow:
      - get:
          url: "/api/health"
      - think: 1
      - get:
          url: "/api/posts"
      - think: 2
      - post:
          url: "/api/auth/login"
          json:
            email: "{{ $randomString() }}@example.com"
            password: "password123"

  - name: "Frontend Pages"
    weight: 30
    flow:
      - get:
          url: "/"
      - think: 3
      - get:
          url: "/dashboard"
      - think: 2
```

#### Test Commands
```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run load-test.yml

# Run with custom target
artillery run load-test.yml --target http://staging.example.com
```

### 4.2 Stress Testing

#### Test Framework
- **Framework**: K6
- **Configuration**: `stress-test.js`

#### Test Structure
```javascript
// Example: stress-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100
    { duration: '2m', target: 200 }, // Ramp up to 200
    { duration: '5m', target: 200 }, // Stay at 200
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
  },
};

export default function() {
  let response = http.get('http://localhost:5000/api/health');
  check(response, { 'status is 200': (r) => r.status === 200 });
  
  response = http.get('http://localhost:5000/api/posts');
  check(response, { 'status is 200': (r) => r.status === 200 });
  
  sleep(1);
}
```

## 5. Security Testing

### 5.1 Vulnerability Scanning

#### Tools
- **Dependency Scanning**: npm audit, Snyk
- **Container Scanning**: Trivy, Clair
- **Code Scanning**: SonarQube, CodeQL

#### Test Commands
```bash
# NPM security audit
npm audit

# Fix vulnerabilities
npm audit fix

# Run Snyk security scan
npx snyk test

# Container vulnerability scan
trivy image innkt-frontend:latest
```

### 5.2 Penetration Testing

#### Test Areas
- [ ] Authentication bypass
- [ ] SQL injection
- [ ] XSS attacks
- [ ] CSRF protection
- [ ] API security
- [ ] File upload security

#### Test Tools
- **OWASP ZAP**: Automated security testing
- **Burp Suite**: Manual security testing
- **Nmap**: Network scanning

## 6. Accessibility Testing

### 6.1 Automated Accessibility Testing

#### Tools
- **axe-core**: JavaScript accessibility testing
- **Lighthouse**: Chrome DevTools accessibility audit
- **pa11y**: Command-line accessibility testing

#### Test Structure
```typescript
// Example: accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('/');
  
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

### 6.2 Manual Accessibility Testing

#### Test Checklist
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast
- [ ] Focus indicators
- [ ] Alt text for images
- [ ] Form labels

## 7. Cross-Browser Testing

### 7.1 Browser Compatibility

#### Supported Browsers
- **Chrome**: Latest 2 versions
- **Firefox**: Latest 2 versions
- **Safari**: Latest 2 versions
- **Edge**: Latest 2 versions

#### Test Framework
- **Playwright**: Cross-browser testing
- **BrowserStack**: Cloud-based testing

#### Test Commands
```bash
# Run tests on all browsers
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
npx playwright test --project=edge
```

## 8. Mobile Testing

### 8.1 Device Testing

#### Test Devices
- **iOS**: iPhone 12+, iPad Pro
- **Android**: Samsung Galaxy S21+, Google Pixel 6+

#### Test Framework
- **Appium**: Cross-platform mobile testing
- **Detox**: React Native testing

#### Test Commands
```bash
# Run Detox tests
npx detox test --configuration ios.sim.debug
npx detox test --configuration android.emu.debug
```

## 9. Test Data Management

### 9.1 Test Data Strategy

#### Data Types
- **Seed Data**: Initial test data
- **Dynamic Data**: Generated during tests
- **Mock Data**: Simulated responses

#### Data Management
```bash
# Database seeding
dotnet run --project Backend/Infrastructure/Database/Seeder

# Reset test data
dotnet run --project Backend/Infrastructure/Database/Seeder --reset
```

## 10. Continuous Integration

### 10.1 CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
# Example: .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:ci
    
    - name: Run E2E tests
      run: npm run test:e2e:ci
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

## 11. Test Reporting

### 11.1 Report Types

#### Coverage Reports
- **Frontend**: Istanbul/nyc
- **Backend**: Coverlet
- **Mobile**: Coverage.py

#### Test Reports
- **JUnit XML**: CI/CD integration
- **HTML Reports**: Local development
- **JSON Reports**: API integration

### 11.2 Report Generation

#### Commands
```bash
# Generate coverage report
npm run test:coverage

# Generate HTML report
npm run test:report

# Generate JUnit XML
npm run test:ci
```

## 12. Test Maintenance

### 12.1 Maintenance Tasks

#### Regular Activities
- [ ] Update test dependencies monthly
- [ ] Review test coverage quarterly
- [ ] Refactor flaky tests weekly
- [ ] Update test data monthly
- [ ] Review test performance quarterly

#### Test Quality Metrics
- **Coverage**: Maintain >80% code coverage
- **Reliability**: <5% flaky test rate
- **Performance**: Test suite runs in <10 minutes
- **Maintainability**: Test code complexity <5

---

**Note**: This testing strategy should be reviewed and updated regularly to ensure it remains effective and aligned with the application's evolution. All tests should be automated where possible and integrated into the CI/CD pipeline.





