using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace IonioPortal.Models
{
    public class ExaminationSchedule
    {
        public int Id { get; set; }
        
        public string Department { get; set; }
        
        public string Semester { get; set; }
        
        public string Period { get; set; }

        [JsonPropertyName("exams")]
        public List<ExamItem> Exams { get; set; }
    }

    public class ExamItem
    {
        [JsonPropertyName("date")]
        public string Date { get; set; } = string.Empty;

        [JsonPropertyName("room")]
        public string Room { get; set; } = string.Empty;

        [JsonPropertyName("time_start")]
        public string TimeStart { get; set; } = string.Empty;

        [JsonPropertyName("time_end")]
        public string TimeEnd { get; set; } = string.Empty;

        [JsonPropertyName("course_name")]
        public string CourseName { get; set; } = string.Empty;

        [JsonPropertyName("professors")]
        public List<string> Professors { get; set; } = new List<string>();
    }
}
