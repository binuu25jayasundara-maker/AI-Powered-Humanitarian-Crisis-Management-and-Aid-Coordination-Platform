namespace ResQnet.Member6.Application.DTOs;

public class CampaignDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal GoalAmount { get; set; }
    public decimal RaisedAmount { get; set; }
    public decimal ProgressPercent => GoalAmount > 0 ? Math.Round((RaisedAmount / GoalAmount) * 100, 1) : 0;
    public int MedicalItemsCount { get; set; }
    public int DisposalFlagCount { get; set; }
    public int FoodAllocationPercent { get; set; }
    public int MedicalAllocationPercent { get; set; }
    public int ShelterAllocationPercent { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; }
}

public class CampaignKpisDto
{
    public decimal TotalRaisedLkr { get; set; }
    public decimal TotalGoalLkr { get; set; }
    public decimal OverallProgressPercent { get; set; }
    public int TotalSuppliesAndItemsCount { get; set; } // e.g. 1,284
    public int ActiveWasteFlagsCount { get; set; } // e.g. 3
    public CampaignDto ActiveCampaign { get; set; } = null!;
}

public class CreateCampaignDto
{
    public string Title { get; set; } = string.Empty;
    public decimal GoalAmount { get; set; }
    public int FoodAllocationPercent { get; set; } = 40;
    public int MedicalAllocationPercent { get; set; } = 35;
    public int ShelterAllocationPercent { get; set; } = 25;
}
