namespace ResQnet.Member6.Application.DTOs;

public class DonationDto
{
    public Guid Id { get; set; }
    public Guid? CampaignId { get; set; }
    public string CampaignTitle { get; set; } = string.Empty;
    public string DonorName { get; set; } = string.Empty; // 'A. Silva', 'Org X', 'K. Perera'
    public decimal Amount { get; set; }
    public int ItemCount { get; set; }
    public string Flag { get; set; } = "-"; // '-', 'Urgent', 'Disposal'
    public bool IsSuspicious { get; set; }
    public string? PaymentReference { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateDonationDto
{
    public Guid? CampaignId { get; set; }
    public string DonorName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int ItemCount { get; set; } = 0;
    public string Flag { get; set; } = "-";
    public string? PaymentReference { get; set; }
}
