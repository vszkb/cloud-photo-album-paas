using Google.Cloud.Storage.V1;
using Microsoft.Extensions.Options;
using photoalbum_be.Models;

namespace photoalbum_be.Services;

public class GoogleCloudStorageService(StorageClient storageClient, IOptions<SystemOptions> options)
    : ICloudStorageService
{
    private readonly string _bucketName = options.Value.GoogleCloudStorage.BucketName;

    public async Task<string> UploadFileAsync(IFormFile file, string fileName)
    {
        await using var stream = file.OpenReadStream();

        await storageClient.UploadObjectAsync(
            _bucketName,
            fileName,
            file.ContentType,
            stream);

        return $"https://storage.googleapis.com/{_bucketName}/{fileName}";
    }

    public async Task DeleteFileAsync(string fileUrl)
    {
        var objectName = ExtractObjectName(fileUrl);
        if (string.IsNullOrEmpty(objectName))
            return;

        await storageClient.DeleteObjectAsync(_bucketName, objectName);
    }

    private string? ExtractObjectName(string fileUrl)
    {
        var prefix = $"https://storage.googleapis.com/{_bucketName}/";
        return fileUrl.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
            ? fileUrl[prefix.Length..]
            : null;
    }
}
