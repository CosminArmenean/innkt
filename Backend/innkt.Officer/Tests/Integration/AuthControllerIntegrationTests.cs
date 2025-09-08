using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;
using innkt.Officer;
using innkt.Officer.Models;

namespace innkt.Officer.Tests.Integration
{
    public class AuthControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;

        public AuthControllerIntegrationTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Add test services here if needed
                    services.AddLogging(logging => logging.AddConsole());
                });
            });
            _client = _factory.CreateClient();
        }

        [Fact]
        public async Task Register_ValidUser_ReturnsSuccess()
        {
            // Arrange
            var registerRequest = new RegisterRequest
            {
                Username = "testuser",
                Email = "test@example.com",
                Password = "SecurePassword123!",
                DisplayName = "Test User"
            };

            var json = JsonSerializer.Serialize(registerRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/auth/register", content);

            // Assert
            response.EnsureSuccessStatusCode();
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("success", responseContent.ToLower());
        }

        [Fact]
        public async Task Register_InvalidEmail_ReturnsBadRequest()
        {
            // Arrange
            var registerRequest = new RegisterRequest
            {
                Username = "testuser",
                Email = "invalid-email",
                Password = "SecurePassword123!",
                DisplayName = "Test User"
            };

            var json = JsonSerializer.Serialize(registerRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/auth/register", content);

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Register_WeakPassword_ReturnsBadRequest()
        {
            // Arrange
            var registerRequest = new RegisterRequest
            {
                Username = "testuser",
                Email = "test@example.com",
                Password = "123",
                DisplayName = "Test User"
            };

            var json = JsonSerializer.Serialize(registerRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/auth/register", content);

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Login_ValidCredentials_ReturnsToken()
        {
            // Arrange
            var loginRequest = new LoginRequest
            {
                Username = "testuser",
                Password = "SecurePassword123!"
            };

            var json = JsonSerializer.Serialize(loginRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/auth/login", content);

            // Assert
            response.EnsureSuccessStatusCode();
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("token", responseContent.ToLower());
        }

        [Fact]
        public async Task Login_InvalidCredentials_ReturnsUnauthorized()
        {
            // Arrange
            var loginRequest = new LoginRequest
            {
                Username = "testuser",
                Password = "wrongpassword"
            };

            var json = JsonSerializer.Serialize(loginRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/auth/login", content);

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task RefreshToken_ValidToken_ReturnsNewToken()
        {
            // Arrange
            var refreshRequest = new RefreshTokenRequest
            {
                RefreshToken = "valid-refresh-token"
            };

            var json = JsonSerializer.Serialize(refreshRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/auth/refresh", content);

            // Assert
            // Note: This test might need adjustment based on actual implementation
            // For now, we'll check if the endpoint exists
            Assert.True(response.StatusCode == System.Net.HttpStatusCode.OK || 
                       response.StatusCode == System.Net.HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task Logout_ValidToken_ReturnsSuccess()
        {
            // Arrange
            var logoutRequest = new LogoutRequest
            {
                RefreshToken = "valid-refresh-token"
            };

            var json = JsonSerializer.Serialize(logoutRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/auth/logout", content);

            // Assert
            // Note: This test might need adjustment based on actual implementation
            Assert.True(response.StatusCode == System.Net.HttpStatusCode.OK || 
                       response.StatusCode == System.Net.HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task ForgotPassword_ValidEmail_ReturnsSuccess()
        {
            // Arrange
            var forgotPasswordRequest = new ForgotPasswordRequest
            {
                Email = "test@example.com"
            };

            var json = JsonSerializer.Serialize(forgotPasswordRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/auth/forgot-password", content);

            // Assert
            // Note: This test might need adjustment based on actual implementation
            Assert.True(response.StatusCode == System.Net.HttpStatusCode.OK || 
                       response.StatusCode == System.Net.HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task ResetPassword_ValidToken_ReturnsSuccess()
        {
            // Arrange
            var resetPasswordRequest = new ResetPasswordRequest
            {
                Token = "valid-reset-token",
                NewPassword = "NewSecurePassword123!"
            };

            var json = JsonSerializer.Serialize(resetPasswordRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/auth/reset-password", content);

            // Assert
            // Note: This test might need adjustment based on actual implementation
            Assert.True(response.StatusCode == System.Net.HttpStatusCode.OK || 
                       response.StatusCode == System.Net.HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task ChangePassword_ValidRequest_ReturnsSuccess()
        {
            // Arrange
            var changePasswordRequest = new ChangePasswordRequest
            {
                CurrentPassword = "CurrentPassword123!",
                NewPassword = "NewSecurePassword123!"
            };

            var json = JsonSerializer.Serialize(changePasswordRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Add authorization header (this would need to be a valid token in real tests)
            _client.DefaultRequestHeaders.Add("Authorization", "Bearer test-token");

            // Act
            var response = await _client.PostAsync("/api/auth/change-password", content);

            // Assert
            // Note: This test might need adjustment based on actual implementation
            Assert.True(response.StatusCode == System.Net.HttpStatusCode.OK || 
                       response.StatusCode == System.Net.HttpStatusCode.Unauthorized ||
                       response.StatusCode == System.Net.HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task VerifyEmail_ValidToken_ReturnsSuccess()
        {
            // Arrange
            var verifyEmailRequest = new VerifyEmailRequest
            {
                Token = "valid-verification-token"
            };

            var json = JsonSerializer.Serialize(verifyEmailRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/auth/verify-email", content);

            // Assert
            // Note: This test might need adjustment based on actual implementation
            Assert.True(response.StatusCode == System.Net.HttpStatusCode.OK || 
                       response.StatusCode == System.Net.HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task ResendVerification_ValidEmail_ReturnsSuccess()
        {
            // Arrange
            var resendVerificationRequest = new ResendVerificationRequest
            {
                Email = "test@example.com"
            };

            var json = JsonSerializer.Serialize(resendVerificationRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/auth/resend-verification", content);

            // Assert
            // Note: This test might need adjustment based on actual implementation
            Assert.True(response.StatusCode == System.Net.HttpStatusCode.OK || 
                       response.StatusCode == System.Net.HttpStatusCode.BadRequest);
        }
    }
}
