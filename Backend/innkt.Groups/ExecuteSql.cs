using Microsoft.EntityFrameworkCore;
using innkt.Groups.Data;
using System;
using System.IO;
using System.Threading.Tasks;

namespace innkt.Groups;

public class ExecuteSql
{
    public static async Task Main(string[] args)
    {
        var connectionString = "Host=localhost;Port=5432;Database=innkt_groups;Username=admin_officer;Password=@CAvp57rt26;TrustServerCertificate=true;";

        var optionsBuilder = new DbContextOptionsBuilder<GroupsDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        using var context = new GroupsDbContext(optionsBuilder.Options);

        try
        {
            Console.WriteLine("🔄 Executing SQL script to add missing columns...");

            // Read the SQL file
            var sqlScript = await File.ReadAllTextAsync("fix_columns.sql");
            
            // Split by semicolon and execute each statement
            var statements = sqlScript.Split(';', StringSplitOptions.RemoveEmptyEntries);
            
            foreach (var statement in statements)
            {
                var trimmedStatement = statement.Trim();
                if (!string.IsNullOrEmpty(trimmedStatement))
                {
                    Console.WriteLine($"Executing: {trimmedStatement.Substring(0, Math.Min(50, trimmedStatement.Length))}...");
                    await context.Database.ExecuteSqlRawAsync(trimmedStatement);
                }
            }

            Console.WriteLine("✅ Database columns added successfully!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error executing SQL: {ex.Message}");
            Console.WriteLine(ex.StackTrace);
        }
    }
}
