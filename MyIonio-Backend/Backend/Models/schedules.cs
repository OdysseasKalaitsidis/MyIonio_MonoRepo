namespace IonioPortal.Models
{
    public class Schedules 
    {
        public int id { get; set; }
        public DateTime created_at { get; set; }
        public string department { get; set; }
        public string semester {  get; set; }
        public string academic_year { get; set; }
        public string period { get; set; }
        public List<CourseEntry> courses { get; set; }
    }
}
