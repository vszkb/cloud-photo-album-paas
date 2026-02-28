using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using photoalbum_be.Models;

namespace photoalbum_be;

public class DataContext(DbContextOptions<DataContext> options) : IdentityDbContext<IdentityUser>(options)
{
    public DbSet<Photo> Photos => Set<Photo>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Photo>(entity =>
        {
            entity.HasOne(p => p.User)
                  .WithMany()
                  .HasForeignKey(p => p.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
