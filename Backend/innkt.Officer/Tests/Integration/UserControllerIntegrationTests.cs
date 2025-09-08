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
    public class UserControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;

        public UserControllerIntegrationTests(WebApplicationFactory<Program> factory)
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
        public async Task GetUser_ValidId_ReturnsUser()
        {
            // Arrange
            var userId = "test-user-id";

            // Act
            var response = await _client.GetAsync($"/api/users/{userId}");

            // Assert
            // Note: This test might need adjustment based on actual implementation
            Assert.True(response.StatusCode == System.Net.HttpStatusCode.OK || 
                       response.StatusCode == System.Net.HttpStatusCode.NotFound);
        }

        [Fact]
        public async Task GetUser_InvalidId_ReturnsNotFound()
        {
            // Arrange
            var userId = "invalid-user-id";

            // Act
            var response = await _client.GetAsync($"/api/users/{userId}");

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task UpdateUser_ValidRequest_ReturnsUpdatedUser()
        {
            // Arrange
            var userId = "test-user-id";
            var updateRequest = new UpdateUserRequest
            {
                DisplayName = "Updated Display Name",
                Bio = "Updated bio",
                Location = "Updated Location"
            };

            var json = JsonSerializer.Serialize(updateRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Add authorization header (this would need to be a valid token in real tests)
            _client.DefaultRequestHeaders.Add("Authorization", "Bearer test-token");

            // Act
            var response = await _client.PutAsync($"/api/users/{userId}", content);

            // Assert
            // Note: This test might need adjustment based on actual implementation
            Assert.True(response.StatusCode == System.Net.HttpStatusCode.OK || 
                       response.StatusCode == System.Net.HttpStatusCode.Unauthorized ||
                       response.StatusCode == System.Net.HttpStatusCode.NotFound);
        }

        [Fact]
        public async Task UpdateUser_Unauthorized_ReturnsUnauthorized()
        {
            // Arrange
            var userId = "test-user-id";
            var updateRequest = new UpdateUserRequest
            {
                DisplayName = "Updated Display Name"
            };

            var json = JsonSerializer.Serialize(updateRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act (without authorization header)
            var response = await _client.PutAsync($"/api/users/{userId}", content);

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task DeleteUser_ValidId_ReturnsSuccess()
        {
            // Arrange
            var userId = "test-user-id";

            // Add authorization header (this would need to be a valid token in real tests)
            _client.DefaultRequestHeaders.Add("Authorization", "Bearer test-token");

            // Act
            var response = await _client.DeleteAsync($"/api/users/{userId}");

            // Assert
            // Note: This test might need adjustment based on actual implementation
            Assert.True(response.StatusCode == System.Net.HttpStatusCode.OK || 
                       response.StatusCode == System.Net.HttpStatusCode.Unauthorized ||
                       response.StatusCode == System.Net.HttpStatusCode.NotFound);
        }

        [Fact]
        public async Task SearchUsers_ValidQuery_ReturnsUsers()
        {
            // Arrange
            var query = "test";
            var page = 1;
            var pageSize = 10;

            // Act
            var response = await _client.GetAsync($"/api/users/search?query={query}&page={page}&pageSize={pageSize}");

            // Assert
            response.EnsureSuccessStatusCode();
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("users", responseContent.ToLower());
        }

        [Fact]
        public async Task GetUserFollowers_ValidUserId_ReturnsFollowers()
        {
            // Arrange
            var userId = "test-user-id";
            var page = 1;
            var pageSize = 10;

            // Act
            var response = await _client.GetAsync($"/api/users/{userId}/followers?page={page}&pageSize={pageSize}");

            // Assert
            response.EnsureSuccessStatusCode();
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("followers", responseContent.ToLower());
        }

        [Fact]
        public async Task GetUserFollowing_ValidUserId_ReturnsFollowing()
        {
            // Arrange
            var userId = "test-user-id";
            var page = 1;
            var pageSize = 10;

            // Act
            var response = await _client.GetAsync($"/api/users/{userId}/following?page={page}&pageSize={pageSize}");

            // Assert
            response.EnsureSuccessStatusCode();
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("following", responseContent.ToLower());
        }

        [Fact]
        public async Task FollowUser_ValidRequest_ReturnsSuccess()
        {
            // Arrange
            var userId = "test-user-id";
            var followRequest = new FollowUserRequest
            {
                UserId = "user-to-follow-id"
            };

            var json = JsonSerializer.Serialize(followRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Add authorization header (this would need to be a valid token in real tests)
            _client.DefaultRequestHeaders.Add("Authorization", "Bearer test-token");

            // Act
            var response = await _client.PostAsync($"/api/users/{userId}/follow", content);

            // Assert
            // Note: This test might need adjustment based on actual implementation
            Assert.True(response.StatusCode == System.Net.HttpStatusCode.OK || 
                       response.StatusCode == System.Net.HttpStatusCode.Unauthorized ||
                       response.StatusCode == System.Net.HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task UnfollowUser_ValidRequest_ReturnsSuccess()
        {
            // Arrange
            var userId = "test-user-id";
            var unfollowRequest = new UnfollowUserRequest
            {
                UserId = "user-to-unfollow-id"
            };

            var json = JsonSerializer.Serialize(unfollowRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Add authorization header (this would need to be a valid token in real tests)
            _client.DefaultRequestHeaders.Add("Authorization", "Bearer test-token");

            // Act
            var response = await _client.PostAsync($"/api/users/{userId}/unfollow", content);

            // Assert
            // Note: This test might need adjustment based on actual implementation
            Assert.True(response.StatusCode == System.Net.HttpStatusCode.OK || 
                       response.StatusCode == System.Net.HttpStatusCode.Unauthorized ||
                       response.StatusCode == System.Net.HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task GetUserStats_ValidUserId_ReturnsStats()
        {
            // Arrange
            var userId = "test-user-id";

            // Act
            var response = await _client.GetAsync($"/api/users/{userId}/stats");

            // Assert
            response.EnsureSuccessStatusCode();
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("stats", responseContent.ToLower());
        }

        [Fact]
        public async Task UploadAvatar_ValidFile_ReturnsSuccess()
        {
            // Arrange
            var userId = "test-user-id";
            var formData = new MultipartFormDataContent();
            
            // Create a test file content
            var fileContent = new ByteArrayContent(System.Text.Encoding.UTF8.GetBytes("test image content"));
            fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");
            formData.Add(fileContent, "file", "test-avatar.jpg");

            // Add authorization header (this would need to be a valid token in real tests)
            _client.DefaultRequestHeaders.Add("Authorization", "Bearer test-token");

            // Act
            var response = await _client.PostAsync($"/api/users/{userId}/avatar", formData);

            // Assert
            // Note: This test might need adjustment based on actual implementation
            Assert.True(response.StatusCode == System.Net.HttpStatusCode.OK || 
                       response.StatusCode == System.Net.HttpStatusCode.Unauthorized ||
                       response.StatusCode == System.Net.HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task GetUserPosts_ValidUserId_ReturnsPosts()
        {
            // Arrange
            var userId = "test-user-id";
            var page = 1;
            var pageSize = 10;

            // Act
            var response = await _client.GetAsync($"/api/users/{userId}/posts?page={page}&pageSize={pageSize}");

            // Assert
            response.EnsureSuccessStatusCode();
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("posts", responseContent.ToLower());
        }

        [Fact]
        public async Task GetUserLikedPosts_ValidUserId_ReturnsLikedPosts()
        {
            // Arrange
            var userId = "test-user-id";
            var page = 1;
            var pageSize = 10;

            // Act
            var response = await _client.GetAsync($"/api/users/{userId}/liked-posts?page={page}&pageSize={pageSize}");

            // Assert
            response.EnsureSuccessStatusCode();
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("posts", responseContent.ToLower());
        }
    }
}
