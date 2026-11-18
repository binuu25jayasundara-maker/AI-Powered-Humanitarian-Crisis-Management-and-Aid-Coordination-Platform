using System.Collections.Generic;
using System.Threading.Tasks;
using ResQnet.Member5.Api.DTOs;

namespace ResQnet.Member5.Api.Interfaces
{
    public interface IShelterService
    {
        Task<List<ShelterDto>> GetAllSheltersAsync(string? search, string? operationalStatus, string? facility);
        Task<ShelterDto?> GetShelterByIdAsync(int id);
        Task<ShelterDto> CreateShelterAsync(CreateShelterDto dto);
        Task<ShelterDto?> UpdateShelterAsync(int id, UpdateShelterDto dto);
        Task<ShelterCapacityDto?> GetCapacityAsync(int id);
        Task<List<NearbyShelterDto>> GetNearbySheltersAsync(double lat, double lng, string? filter);
        Task<HouseholdAllocationDto> AllocateHouseholdAsync(int shelterId, CreateHouseholdAllocationDto dto);
        Task<List<HouseholdAllocationDto>> GetHouseholdAllocationsAsync(int shelterId);
        Task<ShelterSupplyRequestDto> CreateSupplyRequestAsync(CreateShelterSupplyRequestDto dto);
        Task<List<ShelterSupplyRequestDto>> GetSupplyRequestsAsync(int? shelterId);
        Task<ShelterSupplyRequestDto?> UpdateSupplyRequestStatusAsync(int id, UpdateShelterSupplyStatusDto dto);
    }
}
