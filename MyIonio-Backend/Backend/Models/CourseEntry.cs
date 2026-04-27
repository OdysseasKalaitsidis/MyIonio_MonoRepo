namespace IonioPortal.Models
{
    public class CourseEntry
    {
        public Guid Id { get; set; } = Guid.Empty;
        public string Day { get; set; }
        public string Room { get; set; }
        public string Building { get; set; }
        [System.Text.Json.Serialization.JsonPropertyName("time_start")]
        public string TimeStart { get; set; }
        [System.Text.Json.Serialization.JsonPropertyName("time_end")]
        public string TimeEnd { get; set; }
        public string Professor { get; set; }
        [System.Text.Json.Serialization.JsonPropertyName("course_name")]
        public string CourseName { get; set; }
        public string Type { get; set; }
    }
}
