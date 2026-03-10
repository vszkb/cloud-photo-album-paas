using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using photoalbum_be.DTOs;
using photoalbum_be.Models;
using photoalbum_be.Services;

namespace photoalbum_be.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PhotosController(DataContext _context, ICloudStorageService _objectStorage) : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    /// <summary>
    /// Fényképek listázása (csak metaadatok).
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<PhotoListDto>>> GetPhotos(
        [FromQuery] string? sortBy,
        [FromQuery] string? sortDirection)
    {
        IQueryable<Photo> query = _context.Photos;

        var photos = await ApplySorting(query, sortBy, sortDirection)
            .Select(p => new PhotoListDto(p.Id, p.Name, p.UploadDate, p.ImagePath))
            .ToListAsync();

        return Ok(photos);
    }

    /// <summary>
    /// Bejelentkezett felhasználó saját fényképeinek listázása.
    /// </summary>
    [Authorize]
    [HttpGet("my")]
    public async Task<ActionResult<List<PhotoListDto>>> GetMyPhotos(
        [FromQuery] string? sortBy,
        [FromQuery] string? sortDirection)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        IQueryable<Photo> query = _context.Photos.Where(p => p.UserId == userId);

        var photos = await ApplySorting(query, sortBy, sortDirection)
            .Select(p => new PhotoListDto(p.Id, p.Name, p.UploadDate, p.ImagePath))
            .ToListAsync();

        return Ok(photos);
    }

    /// <summary>
    /// Kép metaadatainak és Cloud Storage URL-jének visszaadása az adott azonosító alapján.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<PhotoListDto>> GetPhoto(int id)
    {
        var photo = await _context.Photos.FindAsync(id);
        if (photo is null)
            return NotFound();

        return Ok(new PhotoListDto(photo.Id, photo.Name, photo.UploadDate, photo.ImagePath));
    }

    /// <summary>
    /// Új fénykép feltöltése (multipart/form-data).
    /// A fájl a Google Cloud Storage-ba kerül, a metaadatok az adatbázisba.
    /// </summary>
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<PhotoListDto>> CreatePhoto([FromForm] PhotoUploadDto dto)
    {
        if (dto.Name.Length > 40)
            return BadRequest("A fájlnév nem lehet hosszabb 40 karakternél.");

        var extension = Path.GetExtension(dto.Image.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
            return BadRequest("Nem támogatott fájlformátum. Engedélyezett: jpg, jpeg, png, gif, webp.");

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var fileName = $"{Guid.NewGuid()}{extension}";
        var imageUrl = await _objectStorage.UploadFileAsync(dto.Image, fileName);

        var photo = new Photo
        {
            Name = dto.Name,
            UploadDate = DateTime.UtcNow,
            ImagePath = imageUrl,
            UserId = userId
        };

        _context.Photos.Add(photo);
        await _context.SaveChangesAsync();

        var result = new PhotoListDto(photo.Id, photo.Name, photo.UploadDate, imageUrl);
        return CreatedAtAction(nameof(GetPhoto), new { id = photo.Id }, result);
    }

    /// <summary>
    /// Fénykép törlése
    /// </summary>
    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeletePhoto(int id)
    {
        var photo = await _context.Photos.FindAsync(id);
        if (photo is null)
            return NotFound();

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        if (photo.UserId != userId)
            return Forbid();

        await _objectStorage.DeleteFileAsync(photo.ImagePath);

        _context.Photos.Remove(photo);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Dinamikus rendezés alkalmazása a lekérdezésre.
    /// </summary>
    private static IQueryable<Photo> ApplySorting(
        IQueryable<Photo> query,
        string? sortBy,
        string? sortDirection)
    {
        var descending = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase) || sortDirection is null;

        return sortBy?.ToLowerInvariant() switch
        {
            "name" => descending ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
            _ => descending ? query.OrderByDescending(p => p.UploadDate) : query.OrderBy(p => p.UploadDate)
        };
    }
}
