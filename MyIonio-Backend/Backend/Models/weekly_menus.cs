using Microsoft.VisualBasic;

namespace IonioPortal.Models
{
    public class weekly_menus
    {

        public int id { get; set; }
        public DateTime week_start {  get; set; }
        public DateTime week_end { get; set; }
        public List<DailyMenu> days { get; set; } = new();
        public DateTime created_at { get; set; }
    }
}
