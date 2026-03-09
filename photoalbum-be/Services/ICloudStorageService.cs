using Microsoft.AspNetCore.Http;

namespace photoalbum_be.Services;

public interface ICloudStorageService
{
    Task<string> UploadFileAsync(IFormFile file, string fileName);
    Task DeleteFileAsync(string fileUrl);
}
