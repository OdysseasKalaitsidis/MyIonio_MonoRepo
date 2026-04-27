namespace IonioPortal.DTOs
{
   
    public class ReasoningDto
    {
        public string PrimaryMajor { get; set; } = null!;
        public string SecondaryMajor { get; set; } = null!;
        public List<string> MajorReasons { get; set; } = new();
        public List<string> ToolboxReasons { get; set; } = new();
    }

    public class MajorReasoningDto
    {
        public string Primary { get; set; } = null!;
        public string PrimaryComment { get; set; } = null!;
        public string Secondary { get; set; } = null!;
        public string SecondaryComment { get; set; } = null!;
    }

    public class ToolboxReasoningDto
    {
        public string Primary { get; set; } = null!;
        public string Secondary { get; set; } = null!;
        public string Summary { get; set; } = null!;
    }
}

