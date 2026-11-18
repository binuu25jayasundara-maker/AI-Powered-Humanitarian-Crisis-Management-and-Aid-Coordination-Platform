using System.Collections.Generic;
using System.Threading.Tasks;
using ResQnet.Member5.Api.DTOs;

namespace ResQnet.Member5.Api.Interfaces
{
    public interface IResourceService
    {
        Task<List<ResourceDto>> GetAllResourcesAsync(string? category, string? status, string? search);
        Task<ResourceDto?> GetResourceByIdAsync(int id);
        Task<ResourceDto> CreateResourceAsync(CreateResourceDto dto);
        Task<ResourceDto?> UpdateResourceAsync(int id, UpdateResourceDto dto);
        Task<bool> DeleteResourceAsync(int id);
        Task<ResourceSummaryDto> GetSummaryAsync();
        Task<List<ShortageAlertDto>> GetShortagesAsync();
        Task<ResourceAllocationDto> AllocateResourceAsync(CreateAllocationDto dto);
        Task<List<ResourceAllocationDto>> GetAllocationsAsync();
        Task<PartnerSupportRequestDto> CreatePartnerSupportRequestAsync(CreatePartnerSupportRequestDto dto);
        Task<List<PartnerSupportRequestDto>> GetPartnerSupportRequestsAsync();
        Task<PartnerSupportRequestDto?> UpdatePartnerSupportRequestStatusAsync(int id, UpdateSupportRequestStatusDto dto);
    }
}
