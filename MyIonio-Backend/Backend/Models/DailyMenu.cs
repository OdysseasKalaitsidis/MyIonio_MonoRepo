using System.ComponentModel.DataAnnotations;

namespace IonioPortal.Models
{
    public class DailyMenu
    {

        public string date_iso { get; set; } = string.Empty;
        public string day_name { get; set; } = string.Empty;
        public MenuItems lunch { get; set; } = new();
        public MenuItems dinner { get; set; } = new();
    }
}
