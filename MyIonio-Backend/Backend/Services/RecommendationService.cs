using IonioPortal.Data;
using IonioPortal.DTOs;
using IonioPortal.Models;
using IonioPortal.Enums;
using Microsoft.EntityFrameworkCore;

public class RecommendationService : IRecommendationService
{
    private readonly AppDbContext _context;
    private const int HIGH_CONFIDENCE_THRESHOLD = 8;
    private const int MEDIUM_CONFIDENCE_THRESHOLD = 4;

    public RecommendationService(AppDbContext context) => _context = context;

    public RecommendationDto CalculateResult(List<UserAnswerDto> userAnswers)
    {
        // Input validation
        if (userAnswers == null || userAnswers.Count == 0)
            throw new ArgumentException("User answers cannot be null or empty.", nameof(userAnswers));

        var majors = _context.Majors.Select(m => m.Name).ToList();
        var toolboxes = _context.Toolboxes.Select(t => t.Name).ToList();

        if (majors.Count == 0 || toolboxes.Count == 0)
            throw new InvalidOperationException("No majors or toolboxes found in database.");

        var tracker = new ScoreTracker(majors, toolboxes);

        // Batch load all questions to avoid N+1 query problem
        var questionIds = userAnswers.Select(ua => ua.QuestionId).Distinct().ToList();
        var questions = _context.Questions
            .Include(q => q.Answers)
            .Where(q => questionIds.Contains(q.QuestionId))
            .ToDictionary(q => q.QuestionId);

        // Score each answer 
        foreach (var ua in userAnswers)
        {
            if (!questions.TryGetValue(ua.QuestionId, out var question) || question == null)
                continue;

            foreach (var aid in ua.AnswerIds)
            {
                var answer = question.Answers.FirstOrDefault(a => a.Id == aid);
                if (answer != null)
                {
                    tracker.AddMajorPoints(answer.MajorPoints);
                    tracker.AddToolboxPoints(answer.ToolboxPoints);
                }
            }

            // Handle sliders
            if (question.Type.Equals(QuestionType.Slider.ToString(), StringComparison.OrdinalIgnoreCase) && ua.SliderValue.HasValue)
            {
                ApplySliderScoring(question, ua.SliderValue.Value, tracker);
            }

            // Handle ranking
            if (question.Type.Equals(QuestionType.Ranking.ToString(), StringComparison.OrdinalIgnoreCase) && ua.Ranking != null && ua.Ranking.Count > 0)
            {
                ApplyRankingScoring(question, ua.Ranking, tracker);
            }
        }

        // Step 2: Apply edge case bonus rules
        var rules = _context.ScoringRules.ToList();
        foreach (var rule in rules)
        {
            if (rule.Condition(userAnswers))
                rule.Apply(tracker);
        }

        // Step 3: Determine top majors/toolboxes
        var topMajors = tracker.MajorScores.OrderByDescending(kv => kv.Value).Take(2).ToList();
        var topToolboxes = tracker.ToolboxScores.OrderByDescending(kv => kv.Value).Take(2).ToList();

        // Validate we have enough results
        if (topMajors.Count < 2)
            throw new InvalidOperationException($"Insufficient major scores. Found {topMajors.Count}, expected at least 2.");
        
        if (topToolboxes.Count < 2)
            throw new InvalidOperationException($"Insufficient toolbox scores. Found {topToolboxes.Count}, expected at least 2.");

        var confidence = CalculateConfidence(topMajors);
        var reasoning = GenerateReasoning(topMajors, topToolboxes);
        ComputeScoreComparisons(tracker, out var userMajors, out var maxMajors, out var userToolboxes, out var maxToolboxes);

        return new RecommendationDto
        {
            PrimaryMajor = topMajors[0].Key,
            SecondaryMajor = topMajors[1].Key,
            PrimaryToolbox = topToolboxes[0].Key,
            SecondaryToolbox = topToolboxes[1].Key,
            ConfidenceLevel = confidence,
            Reasoning = reasoning,
            UserMajorScores = userMajors,
            MaxMajorScores = maxMajors,
            UserToolboxScores = userToolboxes,
            MaxToolboxScores = maxToolboxes
        };
    }

    private void ApplySliderScoring(Question question, int value, ScoreTracker tracker)
    {
        // Detect slider answers by their Text prefix ("Slider 1:", "Slider 2:", ...)
        var sliderAnswer = question.Answers
            .Where(a => !string.IsNullOrEmpty(a.Text) &&
                        a.Text.StartsWith("Slider", StringComparison.OrdinalIgnoreCase))
            .OrderBy(a => a.Id)
            .FirstOrDefault();

        if (sliderAnswer == null)
            return;

        int min = sliderAnswer.SliderMin ?? 1;
        int max = sliderAnswer.SliderMax ?? 10;

        // Validate value is within range
        if (value < min || value > max)
            return; // Invalid slider value, skip scoring

        // scoring zones: 1–3 low, 4–6 medium, 7–10 high
        // Low zone: only major points
        if (value >= min && value <= min + 2)
        {
            tracker.AddMajorPoints(sliderAnswer.MajorPoints);
        }
        // Medium zone: major and toolbox points
        else if (value >= min + 3 && value <= min + 5)
        {
            tracker.AddMajorPoints(sliderAnswer.MajorPoints);
            tracker.AddToolboxPoints(sliderAnswer.ToolboxPoints);
        }
        // High zone: major and toolbox points (with potentially higher weight in future)
        else if (value >= min + 6 && value <= max)
        {
            tracker.AddMajorPoints(sliderAnswer.MajorPoints);
            tracker.AddToolboxPoints(sliderAnswer.ToolboxPoints);
        }
    }

    private void ApplyRankingScoring(Question question, List<int> ranking, ScoreTracker tracker)
    {
        for (int i = 0; i < ranking.Count; i++)
        {
            int answerId = ranking[i];

            var answer = question.Answers.FirstOrDefault(a => a.Id == answerId);
            if (answer == null) continue;

            // Higher rank = higher weight
            // Top choice (i=0) gets highest multiplier (ranking.Count), last choice gets 1
            int scale = ranking.Count - i;

            // Scale and add major points
            var scaledMajors = answer.MajorPoints.ToDictionary(kv => kv.Key, kv => kv.Value * scale);
            tracker.AddMajorPoints(scaledMajors);

            // Scale and add toolbox points
            var scaledToolboxes = answer.ToolboxPoints.ToDictionary(kv => kv.Key, kv => kv.Value * scale);
            tracker.AddToolboxPoints(scaledToolboxes);
        }
    }

    private string CalculateConfidence(List<KeyValuePair<string, int>> topMajors)
    {
        if (topMajors.Count < 2)
            return "Low";

        int gap = topMajors[0].Value - topMajors[1].Value;
        return gap > HIGH_CONFIDENCE_THRESHOLD ? "High" : gap >= MEDIUM_CONFIDENCE_THRESHOLD ? "Medium" : "Low";
    }

    private ReasoningDto GenerateReasoning(
    List<KeyValuePair<string, int>> majors,
    List<KeyValuePair<string, int>> toolboxes)
{
    var majorReasons = new List<string>();
    var toolboxReasons = new List<string>();
    var confidence = CalculateConfidence(majors);

    // ---- Major reasoning ----
    int gap = majors[0].Value - majors[1].Value;
    majorReasons.Add($"{majors[0].Key} scored {majors[0].Value} points, {gap} points higher than {majors[1].Key}, indicating your strongest alignment.");
    majorReasons.Add($"Secondary interest detected in {majors[1].Key} with {majors[1].Value} points.");


    //if (confidence == "Low")
    //{
    //    majorReasons.Add("Confidence in these results is low; we recommend discussing your answers with a mentor or teacher to validate and refine your assessment.");
    //}

    // ---- Toolbox reasoning ----
    foreach (var t in toolboxes)
    {
        toolboxReasons.Add($"Toolbox {t.Key} was favored because your answers align strongly with its skill set ({t.Value} points).");
    }

    

    return new ReasoningDto
    {
        PrimaryMajor = majors[0].Key,
        SecondaryMajor = majors[1].Key,
        MajorReasons = majorReasons,
        ToolboxReasons = toolboxReasons,
        
    };
}

    private void ComputeScoreComparisons(ScoreTracker tracker, out Dictionary<string, int> userMajors,
                                      out Dictionary<string, int> maxMajors,
                                      out Dictionary<string, int> userToolboxes,
                                      out Dictionary<string, int> maxToolboxes)
    {
        // User scores from the tracker
        userMajors = tracker.MajorScores;
        userToolboxes = tracker.ToolboxScores;

        // Max possible scores from Majors table
        maxMajors = _context.Majors.ToDictionary(m => m.Name, m => m.Mweight);

        // Max possible scores from Toolboxes table
        maxToolboxes = _context.Toolboxes.ToDictionary(t => t.Name, t => t.TWeight); // assuming Tweight exists
    }




}
