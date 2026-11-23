using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ResQnet.UnifiedApi.Models;

namespace ResQnet.UnifiedApi.Services
{
    public interface IAssistanceRequestService
    {
        Task<AssistanceRequestDto> CreateAsync(CreateAssistanceRequestDto dto, string citizenEmail);
        Task<List<AssistanceRequestDto>> GetMineAsync(string citizenEmail, bool isStaff);
        Task<List<AssistanceRequestDto>> GetAllAsync(string? statusFilter, string? categoryFilter, string? urgencyFilter, bool isStaff);
        Task<AssistanceRequestDto?> GetByIdAsync(Guid id, string callerEmail, bool isStaff);
        Task<AssistanceRequestDto?> UpdateStatusAsync(Guid id, string newStatusDisplay, string? note, string changedByEmail);
        Task<(AssistanceRequestDto? dto, bool conflict)> LinkAiCaseAsync(Guid id, string aiCaseNumber, string calledByEmail);
    }

    public interface ICrisisEventService
    {
        Task<List<CrisisEventDto>> GetAllAsync();
        Task<CrisisEventDto?> GetByIdAsync(Guid id);
        Task<CrisisEventDto> CreateAsync(CreateCrisisEventDto dto);
        Task<CrisisEventDto?> UpdateAsync(Guid id, UpdateCrisisEventDto dto);
        Task<CrisisEventDto?> SetStatusAsync(Guid id, string status);
        Task<CrisisEventDto?> AddAreaAsync(Guid id, AddOperationalAreaDto dto);
    }
}
