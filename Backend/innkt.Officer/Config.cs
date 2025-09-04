using Duende.IdentityServer;
using Duende.IdentityServer.Models;

namespace innkt.Officer;

public static class Config
{
    public static IEnumerable<Client> Clients =>
        new Client[]
        {
            new Client
            {
                ClientId = "innkt.web",
                ClientName = "Innkt Web Application",
                AllowedGrantTypes = GrantTypes.Code,
                RequireClientSecret = false,
                RequirePkce = true,
                
                RedirectUris = { "https://localhost:4200/signin-callback" },
                PostLogoutRedirectUris = { "https://localhost:4200/signout-callback" },
                AllowedCorsOrigins = { "https://localhost:4200" },
                
                AllowedScopes = new List<string>
                {
                    IdentityServerConstants.StandardScopes.OpenId,
                    IdentityServerConstants.StandardScopes.Profile,
                    IdentityServerConstants.StandardScopes.Email,
                    "innkt.api"
                },
                
                AllowAccessTokensViaBrowser = true
            },
            new Client
            {
                ClientId = "innkt.mobile",
                ClientName = "Innkt Mobile Application",
                AllowedGrantTypes = GrantTypes.Code,
                RequireClientSecret = false,
                RequirePkce = true,
                
                RedirectUris = { "com.innkt.app://oauth2redirect" },
                PostLogoutRedirectUris = { "com.innkt.app://signout" },
                
                AllowedScopes = new List<string>
                {
                    IdentityServerConstants.StandardScopes.OpenId,
                    IdentityServerConstants.StandardScopes.Profile,
                    IdentityServerConstants.StandardScopes.Email,
                    "innkt.api"
                },
                
                AllowAccessTokensViaBrowser = true
            }
        };

    public static IEnumerable<IdentityResource> IdentityResources =>
        new IdentityResource[]
        {
            new IdentityResources.OpenId(),
            new IdentityResources.Profile(),
            new IdentityResources.Email()
        };

    public static IEnumerable<ApiScope> ApiScopes =>
        new ApiScope[]
        {
            new ApiScope("innkt.api", "Innkt API")
        };

    public static IEnumerable<ApiResource> ApiResources =>
        new ApiResource[]
        {
            new ApiResource("innkt.api", "Innkt API")
            {
                Scopes = { "innkt.api" }
            }
        };
}



