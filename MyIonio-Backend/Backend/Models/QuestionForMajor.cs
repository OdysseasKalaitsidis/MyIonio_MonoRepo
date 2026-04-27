namespace IonioPortal.Models
{
    public class QuestionForMajor
    {
        public int QuestionId { get; set; } 
        public Question Question { get; set; } = null!;

        public int MajorId {  get; set; }
        public Majors Major { get; set; } = null!;

        public double Weight { get; set; }  


    }
}
