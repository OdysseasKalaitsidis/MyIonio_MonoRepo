namespace IonioPortal.Models
{
    public class QuestionForToolbox

    {
        public int QuestionId { get; set; }
        public Question Question { get; set; } = null!; 
        public int ToolboxId { get; set; }
        public Toolboxes Toolbox { get; set; } = null!;
        public double Weight { get; set; }


    }
}
