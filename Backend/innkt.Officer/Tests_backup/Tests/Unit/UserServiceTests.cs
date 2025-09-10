using Xunit;
using Moq;
using Microsoft.Extensions.Logging;
using innkt.Officer.Services;
using innkt.Officer.Models;
using innkt.Common.Models;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace innkt.Officer.Tests.Unit
{
    public class UserServiceTests
    {
        private readonly Mock<ILogger<UserService>> _mockLogger;
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly Mock<ICacheService> _mockCacheService;
        private readonly UserService _userService;

        public UserServiceTests()
        {
            _mockLogger = new Mock<ILogger<UserService>>();
            _mockUserRepository = new Mock<IUserRepository>();
            _mockCacheService = new Mock<ICacheService>();
            _userService = new UserService(_mockLogger.Object, _mockUserRepository.Object, _mockCacheService.Object);
        }

        [Fact]
        public async Task GetUserByIdAsync_ValidId_ReturnsUser()
        {
            // Arrange
            var userId = "test-user-id";
            var expectedUser = new User
            {
                Id = userId,
                Username = "testuser",
                Email = "test@example.com",
                DisplayName = "Test User"
            };

            _mockUserRepository.Setup(x => x.GetByIdAsync(userId))
                .ReturnsAsync(expectedUser);

            // Act
            var result = await _userService.GetUserByIdAsync(userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(userId, result.Id);
            Assert.Equal("testuser", result.Username);
            Assert.Equal("test@example.com", result.Email);
        }

        [Fact]
        public async Task GetUserByIdAsync_InvalidId_ReturnsNull()
        {
            // Arrange
            var userId = "invalid-id";
            _mockUserRepository.Setup(x => x.GetByIdAsync(userId))
                .ReturnsAsync((User)null);

            // Act
            var result = await _userService.GetUserByIdAsync(userId);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task CreateUserAsync_ValidUser_ReturnsCreatedUser()
        {
            // Arrange
            var newUser = new CreateUserRequest
            {
                Username = "newuser",
                Email = "newuser@example.com",
                DisplayName = "New User",
                Password = "SecurePassword123!"
            };

            var createdUser = new User
            {
                Id = "new-user-id",
                Username = newUser.Username,
                Email = newUser.Email,
                DisplayName = newUser.DisplayName,
                CreatedAt = DateTime.UtcNow
            };

            _mockUserRepository.Setup(x => x.CreateAsync(It.IsAny<User>()))
                .ReturnsAsync(createdUser);

            // Act
            var result = await _userService.CreateUserAsync(newUser);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(newUser.Username, result.Username);
            Assert.Equal(newUser.Email, result.Email);
            Assert.Equal(newUser.DisplayName, result.DisplayName);
        }

        [Fact]
        public async Task UpdateUserAsync_ValidUser_ReturnsUpdatedUser()
        {
            // Arrange
            var userId = "test-user-id";
            var updateRequest = new UpdateUserRequest
            {
                DisplayName = "Updated Display Name",
                Bio = "Updated bio",
                Location = "Updated Location"
            };

            var existingUser = new User
            {
                Id = userId,
                Username = "testuser",
                Email = "test@example.com",
                DisplayName = "Original Display Name"
            };

            var updatedUser = new User
            {
                Id = userId,
                Username = "testuser",
                Email = "test@example.com",
                DisplayName = updateRequest.DisplayName,
                Bio = updateRequest.Bio,
                Location = updateRequest.Location,
                UpdatedAt = DateTime.UtcNow
            };

            _mockUserRepository.Setup(x => x.GetByIdAsync(userId))
                .ReturnsAsync(existingUser);
            _mockUserRepository.Setup(x => x.UpdateAsync(It.IsAny<User>()))
                .ReturnsAsync(updatedUser);

            // Act
            var result = await _userService.UpdateUserAsync(userId, updateRequest);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(updateRequest.DisplayName, result.DisplayName);
            Assert.Equal(updateRequest.Bio, result.Bio);
            Assert.Equal(updateRequest.Location, result.Location);
        }

        [Fact]
        public async Task DeleteUserAsync_ValidId_ReturnsTrue()
        {
            // Arrange
            var userId = "test-user-id";
            _mockUserRepository.Setup(x => x.DeleteAsync(userId))
                .ReturnsAsync(true);

            // Act
            var result = await _userService.DeleteUserAsync(userId);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task SearchUsersAsync_ValidQuery_ReturnsUsers()
        {
            // Arrange
            var query = "test";
            var expectedUsers = new List<User>
            {
                new User { Id = "1", Username = "testuser1", DisplayName = "Test User 1" },
                new User { Id = "2", Username = "testuser2", DisplayName = "Test User 2" }
            };

            _mockUserRepository.Setup(x => x.SearchAsync(query, 10, 0))
                .ReturnsAsync(expectedUsers);

            // Act
            var result = await _userService.SearchUsersAsync(query, 10, 0);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Count);
            Assert.Contains(result, u => u.Username == "testuser1");
            Assert.Contains(result, u => u.Username == "testuser2");
        }

        [Fact]
        public async Task GetUserFollowersAsync_ValidUserId_ReturnsFollowers()
        {
            // Arrange
            var userId = "test-user-id";
            var expectedFollowers = new List<User>
            {
                new User { Id = "follower1", Username = "follower1", DisplayName = "Follower 1" },
                new User { Id = "follower2", Username = "follower2", DisplayName = "Follower 2" }
            };

            _mockUserRepository.Setup(x => x.GetFollowersAsync(userId, 10, 0))
                .ReturnsAsync(expectedFollowers);

            // Act
            var result = await _userService.GetUserFollowersAsync(userId, 10, 0);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Count);
        }

        [Fact]
        public async Task GetUserFollowingAsync_ValidUserId_ReturnsFollowing()
        {
            // Arrange
            var userId = "test-user-id";
            var expectedFollowing = new List<User>
            {
                new User { Id = "following1", Username = "following1", DisplayName = "Following 1" },
                new User { Id = "following2", Username = "following2", DisplayName = "Following 2" }
            };

            _mockUserRepository.Setup(x => x.GetFollowingAsync(userId, 10, 0))
                .ReturnsAsync(expectedFollowing);

            // Act
            var result = await _userService.GetUserFollowingAsync(userId, 10, 0);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Count);
        }

        [Fact]
        public async Task FollowUserAsync_ValidUsers_ReturnsTrue()
        {
            // Arrange
            var followerId = "follower-id";
            var followingId = "following-id";

            _mockUserRepository.Setup(x => x.FollowUserAsync(followerId, followingId))
                .ReturnsAsync(true);

            // Act
            var result = await _userService.FollowUserAsync(followerId, followingId);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task UnfollowUserAsync_ValidUsers_ReturnsTrue()
        {
            // Arrange
            var followerId = "follower-id";
            var followingId = "following-id";

            _mockUserRepository.Setup(x => x.UnfollowUserAsync(followerId, followingId))
                .ReturnsAsync(true);

            // Act
            var result = await _userService.UnfollowUserAsync(followerId, followingId);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task IsFollowingAsync_ValidUsers_ReturnsTrue()
        {
            // Arrange
            var followerId = "follower-id";
            var followingId = "following-id";

            _mockUserRepository.Setup(x => x.IsFollowingAsync(followerId, followingId))
                .ReturnsAsync(true);

            // Act
            var result = await _userService.IsFollowingAsync(followerId, followingId);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task GetUserStatsAsync_ValidUserId_ReturnsStats()
        {
            // Arrange
            var userId = "test-user-id";
            var expectedStats = new UserStats
            {
                UserId = userId,
                FollowersCount = 100,
                FollowingCount = 50,
                PostsCount = 25,
                LikesCount = 500
            };

            _mockUserRepository.Setup(x => x.GetUserStatsAsync(userId))
                .ReturnsAsync(expectedStats);

            // Act
            var result = await _userService.GetUserStatsAsync(userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(userId, result.UserId);
            Assert.Equal(100, result.FollowersCount);
            Assert.Equal(50, result.FollowingCount);
            Assert.Equal(25, result.PostsCount);
            Assert.Equal(500, result.LikesCount);
        }
    }
}
