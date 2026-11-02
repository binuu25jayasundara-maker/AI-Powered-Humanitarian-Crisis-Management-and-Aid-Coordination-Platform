using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ResQnet.Member5.Api.DTOs
{
    public class ResourceDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int AvailableQuantity { get; set; }
        public int AllocatedQuantity { get; set; }
        public int MinimumStockLevel { get; set; }
        public string Unit { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateResourceDto
    {
        [Required]
        [MaxLength(120)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(80)]
        public string Category { get; set; } = string.Empty;

        [Range(0, 10000000)]
        public int AvailableQuantity { get; set; }

        [Range(0, 10000000)]
        public int MinimumStockLevel { get; set; }

        [MaxLength(30)]
        public string Unit { get; set; } = "units";
    }

    public class UpdateResourceDto
    {
        [Required]
        [MaxLength(120)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(80)]
        public string Category { get; set; } = string.Empty;

        [Range(0, 10000000)]
        public int AvailableQuantity { get; set; }

        [Range(0, 10000000)]
        public int MinimumStockLevel { get; set; }

        [MaxLength(30)]
        public string Unit { get; set; } = "units";
    }

    public class ResourceSummaryDto
    {
        public int TotalWaterAvailable { get; set; }
        public int TotalWaterAllocated { get; set; }
        public string WaterStatus { get; set; } = "Normal";

        public int TotalFoodPacksAvailable { get; set; }
        public int TotalFoodPacksAllocated { get; set; }
        public string FoodPacksStatus { get; set; } = "Warning";

        public int TotalMedicineKitsAvailable { get; set; }
        public int TotalMedicineKitsAllocated { get; set; }
        public string MedicineKitsStatus { get; set; } = "Critical";

        public int TotalItemsCount { get; set; }
        public int CriticalStockCount { get; set; }
        public int WarningStockCount { get; set; }
        public int NormalStockCount { get; set; }
    }

    public class ShortageAlertDto
    {
        public int ResourceId { get; set; }
        public string ResourceName { get; set; } = string.Empty;
        public int RequiredQuantity { get; set; }
        public int AvailableQuantity { get; set; }
        public int ShortageAmount { get; set; }
        public string AffectedShelterOrRequest { get; set; } = string.Empty;
        public string Priority { get; set; } = "Critical";
        public string SuggestedResolution { get; set; } = string.Empty;
    }
}
