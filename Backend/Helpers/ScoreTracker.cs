public class ScoreTracker
{
    public Dictionary<string, int> MajorScores { get; private set; } = new();
    public Dictionary<string, int> ToolboxScores { get; private set; } = new();

    public ScoreTracker(IEnumerable<string> majors, IEnumerable<string> toolboxes)
    {
        foreach (var m in majors) MajorScores[m] = 0;
        foreach (var t in toolboxes) ToolboxScores[t] = 0;
    }


    // Adding Points to Majors and Toolboxes
    public void AddMajorPoints(Dictionary<string, int> points)
    {
        foreach (var kv in points)
            if (MajorScores.ContainsKey(kv.Key)) MajorScores[kv.Key] += kv.Value;
    }

    public void AddToolboxPoints(Dictionary<string, int> points)
    {
        foreach (var kv in points)
            if (ToolboxScores.ContainsKey(kv.Key)) ToolboxScores[kv.Key] += kv.Value;
    }
}
