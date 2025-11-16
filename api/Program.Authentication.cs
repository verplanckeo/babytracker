using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Identity.Web;

public static class AuthenticationExtensions
{
   public static IServiceCollection AddAuthentication(this IServiceCollection services, IConfiguration configuration)
   {
      // Add Azure Entra ID authentication
      services
         .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
         .AddMicrosoftIdentityWebApi(configuration, "AzureAd");

      services.AddAuthorization();
      services.AddHttpContextAccessor();

      // Add CORS
      services.AddCors(options =>
      {
         options.AddPolicy("AllowFrontend", policy =>
         {
            policy.WithOrigins(configuration.GetSection("AllowedOrigins").Get<string[]>()!)
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials();
         });
      });

      return services;
   }

   public static WebApplication ApplyAuthentication(this WebApplication app)
   {
      app.UseHttpsRedirection();
      app.UseCors("AllowFrontend");

      app.UseAuthentication();
      app.UseAuthorization();

      return app;
   }
}