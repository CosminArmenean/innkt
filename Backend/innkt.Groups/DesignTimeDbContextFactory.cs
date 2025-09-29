using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using innkt.Groups.Data;

namespace innkt.Groups
{
    public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<GroupsDbContext>
    {
        public GroupsDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<GroupsDbContext>();
            optionsBuilder.UseNpgsql("Host=localhost;Port=5432;Database=innkt_groups;Username=admin_officer;Password=@CAvp57rt26;TrustServerCertificate=true;");

            return new GroupsDbContext(optionsBuilder.Options);
        }
    }
}
