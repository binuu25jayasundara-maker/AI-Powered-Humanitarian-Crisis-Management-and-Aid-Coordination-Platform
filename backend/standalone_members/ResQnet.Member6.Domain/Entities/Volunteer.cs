namespace ResQnet.Member6.Domain.Entities;

public class Volunteer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Skills { get; set; } = string.Empty; // e.g. 'First aid, driving', 'Translation', 'Logistics', 'Medical'
    public string Status { get; set; } = "Available"; // 'Available', 'On Task', 'On Leave'
    public int TotalHours { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<VolunteerTask> AssignedTasks { get; set; } = new List<VolunteerTask>();
}
