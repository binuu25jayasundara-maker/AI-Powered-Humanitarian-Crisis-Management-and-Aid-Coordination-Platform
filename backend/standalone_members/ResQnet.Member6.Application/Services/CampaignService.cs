using ResQnet.Member6.Application.DTOs;
using ResQnet.Member6.Application.Interfaces;
using ResQnet.Member6.Domain.Entities;

namespace ResQnet.Member6.Application.Services;

public class CampaignService
{
    private readonly IUnitOfWork _unitOfWork;

    public CampaignService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<CampaignDto>> GetAllCampaignsAsync()
    {
        var campaigns = await _unitOfWork.Campaigns.GetAllAsync();
        return campaigns.Select(MapToDto);
    }

    public async Task<CampaignDto?> GetCampaignByIdAsync(Guid id)
    {
        var campaign = await _unitOfWork.Campaigns.GetByIdAsync(id);
        return campaign != null ? MapToDto(campaign) : null;
    }

    public async Task<CampaignKpisDto> GetCampaignKpisAsync()
    {
        var campaigns = (await _unitOfWork.Campaigns.GetAllAsync()).ToList();
        var primaryCampaign = campaigns.FirstOrDefault(c => c.Title.Contains("Flood Relief 2024")) 
                              ?? campaigns.FirstOrDefault() 
                              ?? new Campaign
                              {
                                  Title = "Flood Relief 2024",
                                  GoalAmount = 5000000m,
                                  RaisedAmount = 4200000m,
                                  MedicalItemsCount = 1284,
                                  DisposalFlagCount = 3,
                                  FoodAllocationPercent = 40,
                                  MedicalAllocationPercent = 35,
                                  ShelterAllocationPercent = 25
                              };

        decimal totalRaised = campaigns.Any() ? campaigns.Sum(c => c.RaisedAmount) : primaryCampaign.RaisedAmount;
        decimal totalGoal = campaigns.Any() ? campaigns.Sum(c => c.GoalAmount) : primaryCampaign.GoalAmount;
        decimal progress = totalGoal > 0 ? Math.Round((totalRaised / totalGoal) * 100, 1) : 0;
        int totalItems = campaigns.Any() ? campaigns.Sum(c => c.MedicalItemsCount) : primaryCampaign.MedicalItemsCount;
        int wasteFlags = campaigns.Any() ? campaigns.Sum(c => c.DisposalFlagCount) : primaryCampaign.DisposalFlagCount;

        return new CampaignKpisDto
        {
            TotalRaisedLkr = totalRaised,
            TotalGoalLkr = totalGoal,
            OverallProgressPercent = progress,
            TotalSuppliesAndItemsCount = totalItems,
            ActiveWasteFlagsCount = wasteFlags,
            ActiveCampaign = MapToDto(primaryCampaign)
        };
    }

    public async Task<CampaignDto> CreateCampaignAsync(CreateCampaignDto dto)
    {
        var campaign = new Campaign
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            GoalAmount = dto.GoalAmount,
            RaisedAmount = 0,
            MedicalItemsCount = 0,
            DisposalFlagCount = 0,
            FoodAllocationPercent = dto.FoodAllocationPercent,
            MedicalAllocationPercent = dto.MedicalAllocationPercent,
            ShelterAllocationPercent = dto.ShelterAllocationPercent,
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Campaigns.AddAsync(campaign);
        await _unitOfWork.CompleteAsync();

        return MapToDto(campaign);
    }

    private static CampaignDto MapToDto(Campaign c) => new()
    {
        Id = c.Id,
        Title = c.Title,
        GoalAmount = c.GoalAmount,
        RaisedAmount = c.RaisedAmount,
        MedicalItemsCount = c.MedicalItemsCount,
        DisposalFlagCount = c.DisposalFlagCount,
        FoodAllocationPercent = c.FoodAllocationPercent,
        MedicalAllocationPercent = c.MedicalAllocationPercent,
        ShelterAllocationPercent = c.ShelterAllocationPercent,
        Status = c.Status,
        CreatedAt = c.CreatedAt
    };
}
