using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace photoalbum_be.Models;

public class Photo
{
    public int Id { get; set; }

    [Required]
    [MaxLength(40)]
    public required string Name { get; set; }

    public DateTime UploadDate { get; set; }

    public required string ImagePath { get; set; }

    public required string UserId { get; set; }

    public IdentityUser? User { get; set; }
}
