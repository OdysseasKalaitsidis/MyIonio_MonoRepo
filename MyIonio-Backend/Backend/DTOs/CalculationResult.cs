namespace IonioPortal.DTOs
{
    public class CalculationResult
    {
        
            public Dictionary<int, double> MajorScores { get; set; } = new();
            public Dictionary<int, double> ToolboxScores { get; set; } = new();
        
    }
}
