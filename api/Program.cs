using BabyTracker;
using BabyTracker.Database.context;
using BabyTracker.GraphQL;
using HotChocolate.AspNetCore;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApiDocumentation(builder.Configuration);

builder.Services.AddDatabase(builder.Configuration);

builder.Services.AddAuthentication(builder.Configuration);

builder.Services.AddDependencyInjectionServices();

// Add GraphQL
builder.Services
   .AddGraphQLServer()
   .AddAuthorization()
   .AddQueryType<Query>()
   .AddMutationType<Mutation>()
   .AddProjections() // these require Hotchocolate.Data nuget package
   .AddFiltering() // these require Hotchocolate.Data nuget package
   .AddSorting(); // these require Hotchocolate.Data nuget package


var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
   app.UseDeveloperExceptionPage();
}

app.ApplyAuthentication();

// Configure GraphQL endpoint
app.MapGraphQL("/graphql")
   .WithOptions(new GraphQLServerOptions
   {
      Tool = { 
         Enable = true, // Enable in both dev and prod
         Title = "Baby Tracker GraphQL API",
         Document = "Welcome to the Baby Tracker GraphQL API. Use the authentication button to sign in with Azure Entra ID.",
      }
   });

app.ApplyApiDocumentation(app.Configuration);

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
   var context = scope.ServiceProvider.GetRequiredService<BabyTrackerDbContext>();
   context.Database.Migrate();
}

app.Run();