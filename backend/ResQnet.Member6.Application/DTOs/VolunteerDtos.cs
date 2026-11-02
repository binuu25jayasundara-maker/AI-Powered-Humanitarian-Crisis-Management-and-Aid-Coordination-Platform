namespace ResQnet.Member6.Application.DTOs;

public class VolunteerDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Skills { get; set; } = string.Empty;
    public string Status { get; set; } = "Available"; // Available, On Task, On Leave
    public int TotalHours { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<string> WeeklyAvailability { get; set; } = new(); // ["Mon", "Tue", "Wed", "Thu", "Fri"]
}

public class CreateVolunteerDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Skills { get; set; } = string.Empty;
    public string Status { get; set; } = "Available";
}

public class UpdateVolunteerDto
{
    public string? FullName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Skills { get; set; }
    public string? Status { get; set; }
    public int? TotalHours { get; set; }
}

public class VolunteerTaskDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string RequiredSkill { get; set; } = string.Empty;
    public string Status { get; set; } = "Open";
    public Guid? AssignedVolunteerId { get; set; }
    public string? AssignedVolunteerName { get; set; }
    public int MatchScorePercent { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TaskMatchingRecommendationDto
{
    public Guid TaskId { get; set; }
    public string TaskTitle { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string RequiredSkill { get; set; } = string.Empty;
    public Guid CandidateVolunteerId { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public string CandidateEmail { get; set; } = string.Empty;
    public string CandidatePhone { get; set; } = string.Empty;
    public string CandidateSkills { get; set; } = string.Empty;
    public int MatchScorePercent { get; set; }
    public string MatchRationale { get; set; } = string.Empty;
}

public class AssignVolunteerTaskDto
{
    public Guid TaskId { get; set; }
    public Guid VolunteerId { get; set; }
}
