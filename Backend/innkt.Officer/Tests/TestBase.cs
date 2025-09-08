using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;
using innkt.Officer;

namespace innkt.Officer.Tests
{
    public abstract class TestBase : IClassFixture<WebApplicationFactory<Program>>
    {
        protected readonly WebApplicationFactory<Program> Factory;
        protected readonly HttpClient Client;

        protected TestBase(WebApplicationFactory<Program> factory)
        {
            Factory = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Configure test services here
                    services.AddLogging(logging => logging.AddConsole());
                });
            });
            Client = Factory.CreateClient();
        }

        protected async Task<string> GetAuthTokenAsync(string username = "testuser", string password = "SecurePassword123!")
        {
            var loginRequest = new
            {
                Username = username,
                Password = password
            };

            var json = JsonSerializer.Serialize(loginRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await Client.PostAsync("/api/auth/login", content);
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                var loginResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);
                
                if (loginResponse.TryGetProperty("data", out var data) && 
                    data.TryGetProperty("token", out var token))
                {
                    return token.GetString();
                }
            }

            return null;
        }

        protected void SetAuthHeader(string token)
        {
            Client.DefaultRequestHeaders.Authorization = 
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        }

        protected async Task<HttpResponseMessage> PostAsync(string endpoint, object data)
        {
            var json = JsonSerializer.Serialize(data);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            return await Client.PostAsync(endpoint, content);
        }

        protected async Task<HttpResponseMessage> PutAsync(string endpoint, object data)
        {
            var json = JsonSerializer.Serialize(data);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            return await Client.PutAsync(endpoint, content);
        }

        protected async Task<T> DeserializeResponseAsync<T>(HttpResponseMessage response)
        {
            var content = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<T>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }

        protected async Task<JsonElement> DeserializeResponseAsync(HttpResponseMessage response)
        {
            var content = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<JsonElement>(content);
        }

        protected void AssertSuccessResponse(HttpResponseMessage response)
        {
            Assert.True(response.IsSuccessStatusCode, 
                $"Expected success status code, but got {response.StatusCode}. " +
                $"Response: {response.Content.ReadAsStringAsync().Result}");
        }

        protected void AssertBadRequestResponse(HttpResponseMessage response)
        {
            Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
        }

        protected void AssertUnauthorizedResponse(HttpResponseMessage response)
        {
            Assert.Equal(System.Net.HttpStatusCode.Unauthorized, response.StatusCode);
        }

        protected void AssertNotFoundResponse(HttpResponseMessage response)
        {
            Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
        }

        protected void AssertForbiddenResponse(HttpResponseMessage response)
        {
            Assert.Equal(System.Net.HttpStatusCode.Forbidden, response.StatusCode);
        }

        protected void AssertInternalServerErrorResponse(HttpResponseMessage response)
        {
            Assert.Equal(System.Net.HttpStatusCode.InternalServerError, response.StatusCode);
        }

        protected void AssertResponseContains(HttpResponseMessage response, string expectedContent)
        {
            var content = response.Content.ReadAsStringAsync().Result;
            Assert.Contains(expectedContent, content, System.StringComparison.OrdinalIgnoreCase);
        }

        protected void AssertResponseDoesNotContain(HttpResponseMessage response, string unexpectedContent)
        {
            var content = response.Content.ReadAsStringAsync().Result;
            Assert.DoesNotContain(unexpectedContent, content, System.StringComparison.OrdinalIgnoreCase);
        }

        protected void AssertValidJsonResponse(HttpResponseMessage response)
        {
            AssertSuccessResponse(response);
            var content = response.Content.ReadAsStringAsync().Result;
            Assert.True(IsValidJson(content), "Response is not valid JSON");
        }

        private bool IsValidJson(string json)
        {
            try
            {
                JsonSerializer.Deserialize<JsonElement>(json);
                return true;
            }
            catch
            {
                return false;
            }
        }

        protected void AssertResponseHasProperty(HttpResponseMessage response, string propertyName)
        {
            AssertSuccessResponse(response);
            var content = response.Content.ReadAsStringAsync().Result;
            var json = JsonSerializer.Deserialize<JsonElement>(content);
            Assert.True(json.TryGetProperty(propertyName, out _), 
                $"Response does not contain property '{propertyName}'");
        }

        protected void AssertResponsePropertyEquals<T>(HttpResponseMessage response, string propertyName, T expectedValue)
        {
            AssertSuccessResponse(response);
            var content = response.Content.ReadAsStringAsync().Result;
            var json = JsonSerializer.Deserialize<JsonElement>(content);
            
            Assert.True(json.TryGetProperty(propertyName, out var property), 
                $"Response does not contain property '{propertyName}'");
            
            var actualValue = JsonSerializer.Deserialize<T>(property.GetRawText());
            Assert.Equal(expectedValue, actualValue);
        }

        protected void AssertResponseArrayHasItems(HttpResponseMessage response, string arrayPropertyName)
        {
            AssertSuccessResponse(response);
            var content = response.Content.ReadAsStringAsync().Result;
            var json = JsonSerializer.Deserialize<JsonElement>(content);
            
            Assert.True(json.TryGetProperty(arrayPropertyName, out var array), 
                $"Response does not contain array property '{arrayPropertyName}'");
            
            Assert.True(array.ValueKind == JsonValueKind.Array, 
                $"Property '{arrayPropertyName}' is not an array");
            
            Assert.True(array.GetArrayLength() > 0, 
                $"Array '{arrayPropertyName}' is empty");
        }

        protected void AssertResponseArrayHasCount(HttpResponseMessage response, string arrayPropertyName, int expectedCount)
        {
            AssertSuccessResponse(response);
            var content = response.Content.ReadAsStringAsync().Result;
            var json = JsonSerializer.Deserialize<JsonElement>(content);
            
            Assert.True(json.TryGetProperty(arrayPropertyName, out var array), 
                $"Response does not contain array property '{arrayPropertyName}'");
            
            Assert.True(array.ValueKind == JsonValueKind.Array, 
                $"Property '{arrayPropertyName}' is not an array");
            
            Assert.Equal(expectedCount, array.GetArrayLength());
        }

        protected void AssertResponseHasPagination(HttpResponseMessage response)
        {
            AssertSuccessResponse(response);
            var content = response.Content.ReadAsStringAsync().Result;
            var json = JsonSerializer.Deserialize<JsonElement>(content);
            
            Assert.True(json.TryGetProperty("pagination", out var pagination), 
                "Response does not contain pagination information");
            
            Assert.True(pagination.TryGetProperty("page", out _), 
                "Pagination does not contain 'page' property");
            Assert.True(pagination.TryGetProperty("pageSize", out _), 
                "Pagination does not contain 'pageSize' property");
            Assert.True(pagination.TryGetProperty("totalCount", out _), 
                "Pagination does not contain 'totalCount' property");
            Assert.True(pagination.TryGetProperty("totalPages", out _), 
                "Pagination does not contain 'totalPages' property");
        }

        protected void AssertResponseHasError(HttpResponseMessage response, string expectedError = null)
        {
            AssertSuccessResponse(response);
            var content = response.Content.ReadAsStringAsync().Result;
            var json = JsonSerializer.Deserialize<JsonElement>(content);
            
            Assert.True(json.TryGetProperty("success", out var success), 
                "Response does not contain 'success' property");
            Assert.False(success.GetBoolean(), "Response should indicate failure");
            
            if (expectedError != null)
            {
                Assert.True(json.TryGetProperty("message", out var message), 
                    "Response does not contain 'message' property");
                Assert.Contains(expectedError, message.GetString(), System.StringComparison.OrdinalIgnoreCase);
            }
        }

        protected void AssertResponseHasSuccess(HttpResponseMessage response)
        {
            AssertSuccessResponse(response);
            var content = response.Content.ReadAsStringAsync().Result;
            var json = JsonSerializer.Deserialize<JsonElement>(content);
            
            Assert.True(json.TryGetProperty("success", out var success), 
                "Response does not contain 'success' property");
            Assert.True(success.GetBoolean(), "Response should indicate success");
        }
    }
}
