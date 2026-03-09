using Google.Cloud.Storage.V1;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using photoalbum_be;
using photoalbum_be.Models;
using photoalbum_be.Services;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddOptions<SystemOptions>()
    .Bind(builder.Configuration)
    .ValidateDataAnnotations()
    .ValidateOnStart();

var systemOptions = builder.Configuration.Get<SystemOptions>();


builder.Services.AddDbContext<DataContext>(options =>
    options.UseNpgsql(systemOptions!.ConnectionStrings.DefaultConnection));

builder.Services.AddIdentityApiEndpoints<IdentityUser>()
    .AddEntityFrameworkStores<DataContext>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        if (systemOptions?.AllowedOrigins != null && systemOptions.AllowedOrigins.Length > 0)
        {
            policy.WithOrigins(systemOptions.AllowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
    });
});

builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        var schemeName = "Bearer";

        var securityScheme = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
        };

        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
        document.Components.SecuritySchemes[schemeName] = securityScheme;


        var schemeRef = new OpenApiSecuritySchemeReference(schemeName, document);

        var securityRequirement = new OpenApiSecurityRequirement
        {
            [schemeRef] = []
        };

        document.Security ??= new List<OpenApiSecurityRequirement>();
        document.Security.Add(securityRequirement);

        return Task.CompletedTask;
    });
});

builder.Services.AddAuthentication();
builder.Services.AddAuthorization();

builder.Services.AddSingleton(_ => StorageClient.Create());
builder.Services.AddScoped<ICloudStorageService, GoogleCloudStorageService>();

builder.Services.AddControllers();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<DataContext>();
    dbContext.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}


app.UseRouting();

app.UseCors("CorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapIdentityApi<IdentityUser>();
app.MapControllers();

app.Run();