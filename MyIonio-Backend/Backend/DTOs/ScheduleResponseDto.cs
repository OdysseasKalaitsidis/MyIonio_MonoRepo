public class ScheduleResponseDto
{
    public string CourseName { get; set; } = null!;
    public string Day { get; set; } = null!;
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string Room { get; set; } = null!;
}
