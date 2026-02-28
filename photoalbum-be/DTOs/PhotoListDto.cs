namespace photoalbum_be.DTOs;

/// <summary>
/// A fényképek listázásához használt DTO (csak metaadatok, fájl nélkül).
/// </summary>
public record PhotoListDto(int Id, string Name, DateTime UploadDate);
