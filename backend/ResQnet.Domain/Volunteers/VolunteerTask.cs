namespace ResQnet.Member6.Domain.Entities;

public class VolunteerTask
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty; // e.g. 'Distribute meals - Rivagama'
    public string Category { get; set; } = "Relief Logistics";
    public string Location { get; set; } = string.Empty;
    public string RequiredSkill { get; set; } = string.Empty; // e.g. 'Logistics'
    public string Status { get; set; } = "Open"; // 'Open', 'Assigned', 'In Progress', 'Completed'
    public Guid? AssignedVolunteerId { get; set; }
    public Volunteer? AssignedVolunteer { get; set; }
    public int MatchScorePercent { get; set; } = 67;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
