using Microsoft.OpenApi.Models;
using Scalar.AspNetCore;

public static class OpenApiExtensions
{
    public static IServiceCollection AddOpenApiDocumentation(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOpenApi(options =>
        {
            options.AddDocumentTransformer((doc, ctx, ct) =>
            {
                doc.Components ??= new();
                doc.Components.SecuritySchemes ??= new Dictionary<string, OpenApiSecurityScheme>();

                var tenantId = configuration["AzureAd:TenantId"]!;
                var apiScope = $"{configuration["AzureAd:Audience"]}/user_impersonation";

                var scheme = new OpenApiSecurityScheme
                {
                    Type = SecuritySchemeType.OAuth2,
                    Flows = new OpenApiOAuthFlows
                    {
                        AuthorizationCode = new OpenApiOAuthFlow
                        {
                            AuthorizationUrl = new Uri($"https://login.microsoftonline.com/common/oauth2/v2.0/authorize"),
                            TokenUrl         = new Uri($"https://login.microsoftonline.com/common/oauth2/v2.0/token"),
                            Scopes = new Dictionary<string,string>
                            {
                                { apiScope, "Access the API" },
                                { "openid", "Sign-in" },
                                { "profile", "Profile" },
                                { "offline_access", "Refresh tokens" }
                            }
                        }
                    }
                };

                doc.Components.SecuritySchemes["OAuth2"] = scheme;
                doc.SecurityRequirements ??= new List<OpenApiSecurityRequirement>();
                doc.SecurityRequirements.Add(new OpenApiSecurityRequirement { [scheme] = new[] { apiScope } });

                return Task.CompletedTask;
            });
        });

        return services;
    }

    public static WebApplication ApplyApiDocumentation(this WebApplication app, IConfiguration configuration)
    {
        app.MapOpenApi("/openapi/v1.json");

        app.MapScalarApiReference("/docs", options =>
        {
            options
                .WithOpenApiRoutePattern("/openapi/v1.json")
                .AddPreferredSecuritySchemes(new List<string>{"OAuth2"})
                .AddAuthorizationCodeFlow("OAuth2", flow =>
                {
                    flow.ClientId = configuration["AzureAd:ClientId"]!;
                    flow.Pkce     = Pkce.Sha256;
                    flow.SelectedScopes =
                    [
                        $"{configuration["AzureAd:Audience"]}/user_impersonation",
                        "openid", "profile", "offline_access"
                    ];
                });
        });

        return app;
    }
}