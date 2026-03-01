using System.ComponentModel.DataAnnotations;

namespace photoalbum_be.DTOs;

public class PhotoUploadDto
{
    [Required]
    [MaxLength(40)]
    public required string Name { get; set; }

    [Required]
    public required IFormFile Image { get; set; }
}
