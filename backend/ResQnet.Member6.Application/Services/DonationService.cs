using ResQnet.Member6.Application.DTOs;
using ResQnet.Member6.Application.Interfaces;
using ResQnet.Member6.Domain.Entities;
using ResQnet.Member6.Domain.Events;

namespace ResQnet.Member6.Application.Services;

public class DonationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDomainEventDispatcher _eventDispatcher;

    public DonationService(IUnitOfWork unitOfWork, IDomainEventDispatcher eventDispatcher)
    {
        _unitOfWork = unitOfWork;
        _eventDispatcher = eventDispatcher;
    }

    public async Task<IEnumerable<DonationDto>> GetAllDonationsAsync()
    {
        var donations = await _unitOfWork.Donations.GetAllAsync();
        return donations.OrderByDescending(d => d.CreatedAt).Select(d => new DonationDto
        {
            Id = d.Id,
            CampaignId = d.CampaignId,
            CampaignTitle = d.Campaign?.Title ?? "General Relief",
            DonorName = d.DonorName,
            Amount = d.Amount,
            ItemCount = d.ItemCount,
            Flag = d.Flag,
            IsSuspicious = d.IsSuspicious,
            PaymentReference = d.PaymentReference,
            CreatedAt = d.CreatedAt
        });
    }

    public async Task<DonationDto> RecordDonationAsync(CreateDonationDto dto)
    {
        Campaign? campaign = null;
        if (dto.CampaignId.HasValue)
        {
            campaign = await _unitOfWork.Campaigns.GetByIdAsync(dto.CampaignId.Value);
        }
        else
        {
            var campaigns = await _unitOfWork.Campaigns.GetAllAsync();
            campaign = campaigns.FirstOrDefault();
        }

        var donation = new Donation
        {
            Id = Guid.NewGuid(),
            CampaignId = campaign?.Id,
            DonorName = dto.DonorName,
            Amount = dto.Amount,
            ItemCount = dto.ItemCount,
            Flag = dto.Flag ?? "-",
            IsSuspicious = false,
            PaymentReference = dto.PaymentReference ?? $"TXN-{Guid.NewGuid().ToString()[..8].ToUpper()}",
            CreatedAt = DateTime.UtcNow
        };

        if (campaign != null)
        {
            campaign.RaisedAmount += dto.Amount;
            campaign.MedicalItemsCount += dto.ItemCount;
            if (dto.Flag == "Disposal")
            {
                campaign.DisposalFlagCount += 1;
            }
            _unitOfWork.Campaigns.Update(campaign);
        }

        await _unitOfWork.Donations.AddAsync(donation);
        await _unitOfWork.CompleteAsync();

        // Dispatch Observer domain event
        await _eventDispatcher.DispatchAsync(new DonationReceivedEvent
        {
            DonationId = donation.Id,
            DonorName = donation.DonorName,
            Amount = donation.Amount,
            ItemCount = donation.ItemCount,
            Flag = donation.Flag,
            CampaignId = campaign?.Id,
            CampaignTitle = campaign?.Title ?? "General Relief"
        });

        return new DonationDto
        {
            Id = donation.Id,
            CampaignId = donation.CampaignId,
            CampaignTitle = campaign?.Title ?? "General Relief",
            DonorName = donation.DonorName,
            Amount = donation.Amount,
            ItemCount = donation.ItemCount,
            Flag = donation.Flag,
            IsSuspicious = donation.IsSuspicious,
            PaymentReference = donation.PaymentReference,
            CreatedAt = donation.CreatedAt
        };
    }
}
