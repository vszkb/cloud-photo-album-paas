using System.ComponentModel.DataAnnotations;

namespace photoalbum_be.DTOs;

/// <summary>
/// Fénykép feltöltéséhez használt DTO (multipart/form-data).
/// </summary>
public class PhotoUploadDto
{
    [Required]
    [MaxLength(40)]
    public required string Name { get; set; }

    [Required]
    public required IFormFile Image { get; set; }
}
