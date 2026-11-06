namespace ResQnet.Member6.Domain.Entities;

public class Donation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? CampaignId { get; set; }
    public Campaign? Campaign { get; set; }
    public string DonorName { get; set; } = string.Empty; // 'A. Silva', 'Org X', 'K. Perera'
    public decimal Amount { get; set; } // 25000, 300000, 5000
    public int ItemCount { get; set; } = 0; // In-kind item count
    public string Flag { get; set; } = "-"; // '-', 'Urgent', 'Disposal'
    public bool IsSuspicious { get; set; } = false;
    public string? PaymentReference { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
