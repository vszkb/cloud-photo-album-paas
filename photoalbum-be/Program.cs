using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using photoalbum_be;
using photoalbum_be.Models;
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

        // 1. JWT Séma definiálása
        var securityScheme = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description = "Ide másold be az accessToken-t (a 'Bearer ' szócska nélkül)!"
        };

        // 2. Hozzáadás a komponensekhez
        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
        document.Components.SecuritySchemes[schemeName] = securityScheme;

        // 3. AZ ÚJ .NET 10 MEGOLDÁS: OpenApiSecuritySchemeReference
        // Ez váltotta le teljesen a régi, bonyolult Reference mechanizmust!
        var schemeRef = new OpenApiSecuritySchemeReference(schemeName, document);

        var securityRequirement = new OpenApiSecurityRequirement
        {
            [schemeRef] = [] // Üres tömb a scope-oknak (a C# 12+ collection expressionnel)
        };

        // 4. Alkalmazás a teljes API dokumentációra
        document.Security ??= new List<OpenApiSecurityRequirement>();
        document.Security.Add(securityRequirement);

        return Task.CompletedTask;
    });
});

builder.Services.AddAuthentication();
builder.Services.AddAuthorization();

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