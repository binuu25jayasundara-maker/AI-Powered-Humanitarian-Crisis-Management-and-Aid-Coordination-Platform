namespace ResQnet.Member6.Domain.Entities;

public class Campaign
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty; // 'Flood Relief 2024'
    public decimal GoalAmount { get; set; } = 5000000.00m; // LKR 5M
    public decimal RaisedAmount { get; set; } = 4200000.00m; // LKR 4.2M
    public int MedicalItemsCount { get; set; } = 1284;
    public int DisposalFlagCount { get; set; } = 3;
    public int FoodAllocationPercent { get; set; } = 40;
    public int MedicalAllocationPercent { get; set; } = 35;
    public int ShelterAllocationPercent { get; set; } = 25;
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Donation> Donations { get; set; } = new List<Donation>();
}
