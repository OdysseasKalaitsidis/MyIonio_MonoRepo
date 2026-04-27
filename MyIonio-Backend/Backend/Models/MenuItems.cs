namespace IonioPortal.Models
{
    public class MenuItems
    {
        public List<string> main_courses { get; set; } = new();
        public bool has_salad { get; set; }
        public bool has_dessert { get; set; }
        public string? notes { get; set; }
    }
}
