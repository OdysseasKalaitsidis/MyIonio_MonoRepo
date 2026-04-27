namespace IonioPortal.DTOs
{
    public class AnswerOptionDto
    {
        public int Id { get; set; }
        public string Text { get; set; } = null!;

        public int Weight { get; set; }
        public Dictionary<string, int> MajorPoints { get; set; } = new();    
        public Dictionary<string, int> ToolboxPoints { get; set; } = new();
        public int? SliderMin { get; set; } = null;
        public int? SliderMax { get; set; } = null;
        public List<int>? RankingOptions { get; set; } = null;

    }

}