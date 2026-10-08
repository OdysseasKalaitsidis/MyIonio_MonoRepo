namespace MyIonio.Models
{
    public class CourseEntry
    {
        public Guid Id { get; set; } = Guid.Empty;
        [System.Text.Json.Serialization.JsonPropertyName("course_id")]
        public string CourseId { get; set; } = string.Empty;
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
        public string Type { get; set; } = string.Empty;
        [System.Text.Json.Serialization.JsonPropertyName("delivery_type")]
        public string DeliveryType { get; set; } = string.Empty;
        [System.Text.Json.Serialization.JsonPropertyName("schedule_track")]
        public string ScheduleTrack { get; set; } = "COMMON";
        [System.Text.Json.Serialization.JsonPropertyName("roles")]
        public List<CourseRole> Roles { get; set; } = new();
        [System.Text.Json.Serialization.JsonPropertyName("toolboxes")]
        public List<string> Toolboxes { get; set; } = new();
    }
}

