using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using photoalbum_be.DTOs;
using photoalbum_be.Models;

namespace photoalbum_be.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PhotosController(DataContext db, IWebHostEnvironment env) : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    /// <summary>
    /// Fényképek listázása (csak metaadatok).
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<PhotoListDto>>> GetPhotos([FromQuery] string? sortBy)
    {
        IQueryable<Photo> query = db.Photos;

        query = sortBy?.ToLowerInvariant() switch
        {
            "name" => query.OrderBy(p => p.Name),
            _ => query.OrderByDescending(p => p.UploadDate)
        };

        var photos = await query
            .Select(p => new PhotoListDto(p.Id, p.Name, p.UploadDate))
            .ToListAsync();

        return Ok(photos);
    }

    /// <summary>
    /// Kép visszaadása az adott azonosító alapján.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetPhoto(int id)
    {
        var photo = await db.Photos.FindAsync(id);
        if (photo is null)
            return NotFound();

        var filePath = Path.Combine(GetWebRootPath(), photo.ImagePath);
        if (!System.IO.File.Exists(filePath))
            return NotFound();

        var contentType = GetContentType(filePath);
        return PhysicalFile(filePath, contentType);
    }

    /// <summary>
    /// Új fénykép feltöltése (multipart/form-data).
    /// A fájl a wwwroot/uploads mappába kerül, a metaadatok az adatbázisba.
    /// </summary>
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<PhotoListDto>> CreatePhoto([FromForm] PhotoUploadDto dto)
    {
        var extension = Path.GetExtension(dto.Image.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
            return BadRequest("Nem támogatott fájlformátum. Engedélyezett: jpg, jpeg, png, gif, webp.");

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var uploadsDir = Path.Combine(GetWebRootPath(), "uploads");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsDir, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await dto.Image.CopyToAsync(stream);

        var photo = new Photo
        {
            Name = dto.Name,
            UploadDate = DateTime.UtcNow,
            ImagePath = $"uploads/{fileName}",
            UserId = userId
        };

        db.Photos.Add(photo);
        await db.SaveChangesAsync();

        var result = new PhotoListDto(photo.Id, photo.Name, photo.UploadDate);
        return CreatedAtAction(nameof(GetPhoto), new { id = photo.Id }, result);
    }

    /// <summary>
    /// Fénykép törlése
    /// </summary>
    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeletePhoto(int id)
    {
        var photo = await db.Photos.FindAsync(id);
        if (photo is null)
            return NotFound();

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        if (photo.UserId != userId)
            return Forbid();

        var filePath = Path.Combine(GetWebRootPath(), photo.ImagePath);
        if (System.IO.File.Exists(filePath))
            System.IO.File.Delete(filePath);

        db.Photos.Remove(photo);
        await db.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// WebRootPath biztonságos lekérése (ha a wwwroot mappa nem létezik, fallback a ContentRootPath/wwwroot-ra).
    /// </summary>
    private string GetWebRootPath()
    {
        return env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
    }

    /// <summary>
    /// MIME típus meghatározása a fájl kiterjesztése alapján.
    /// </summary>
    private static string GetContentType(string filePath)
    {
        return Path.GetExtension(filePath).ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };
    }
}
