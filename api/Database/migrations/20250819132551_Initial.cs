using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BabyTracker.Database.migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BabyEntries",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", maxLength: 10, nullable: false),
                    Time = table.Column<TimeOnly>(type: "time", maxLength: 5, nullable: false),
                    FeedType = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    StartingBreast = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    Temperature = table.Column<double>(type: "float", nullable: true),
                    DidPee = table.Column<bool>(type: "bit", nullable: false),
                    DidPoo = table.Column<bool>(type: "bit", nullable: false),
                    DidThrowUp = table.Column<bool>(type: "bit", nullable: false),
                    Created = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    UserId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BabyEntries", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BabyEntries_UserId",
                table: "BabyEntries",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_BabyEntries_UserId_Date",
                table: "BabyEntries",
                columns: new[] { "UserId", "Date" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BabyEntries");
        }
    }
}
