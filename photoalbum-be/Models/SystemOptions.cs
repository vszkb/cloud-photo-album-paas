namespace photoalbum_be.Models;

public class SystemOptions
{
    public required string[] AllowedOrigins { get; set; } = [];

    public required ConnectionStringsOptions ConnectionStrings { get; set; }
}

public class ConnectionStringsOptions
{
    public required string DefaultConnection { get; set; }
}