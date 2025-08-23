using BabyTracker;
using BabyTracker.Database.context;
using BabyTracker.GraphQL;
using BabyTracker.Infra;
using HotChocolate.AspNetCore;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApiDocumentation(builder.Configuration);

builder.Services.AddDatabase(builder.Configuration);

builder.Services.AddAuthentication(builder.Configuration);

builder.Services.AddDependencyInjectionServices();

builder.Services.AddGraphQL(builder.Configuration);

builder.Services.AddHttpResponseFormatter<StatusCodeHttpResponseFormatter>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
   app.UseDeveloperExceptionPage();
}

app.ApplyAuthentication();

app.ApplyGraphQL(app.Configuration);

app.ApplyApiDocumentation(app.Configuration);

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
   var context = scope.ServiceProvider.GetRequiredService<BabyTrackerDbContext>();
   context.Database.Migrate();
}

app.Run();