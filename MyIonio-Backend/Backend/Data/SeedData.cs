using System.Collections.Generic;
using IonioPortal.Models;
using Microsoft.EntityFrameworkCore;

namespace IonioPortal.Data
{
    public static class SeedData
    {
        public static void Seed(this ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Majors>().HasData(
                new Majors { Id = 1, Name = "ΒΥΝ", Description = "Bioinformatics and Computational Intelligence", Mweight = 48 },
                new Majors { Id = 2, Name = "ΚΔΕ", Description = "Cyber-security and Communication Networks", Mweight = 35 },
                new Majors { Id = 3, Name = "ΨΜΑΔ", Description = "Digital Transformation and Data Analytics", Mweight = 66 }
            );

            modelBuilder.Entity<Toolboxes>().HasData(
                new Toolboxes { Id = 1, Name = "TB1", Description = "Theoretical Computer Science", TWeight = 7 },
                new Toolboxes { Id = 2, Name = "TB2", Description = "Interaction", TWeight = 23 },
                new Toolboxes { Id = 3, Name = "TB3", Description = "Pedagogy", TWeight = 7 },
                new Toolboxes { Id = 4, Name = "TB4", Description = "Software", TWeight = 14 },
                new Toolboxes { Id = 5, Name = "TB5", Description = "Humanistic Dimensions of Computer Science", TWeight = 24 }
            );

            modelBuilder.Entity<Question>().HasData(
                new Question { QuestionId = 1, Text = "🎮 Saturday night, laptop open. What are you actually doing?", Type = "single", Index = 1, Weight = 1 },
                new Question { QuestionId = 2, Text = "📊 When coding, I'm more 1=Theory/Elegant, 10=Practical", Type = "slider", Index = 2, Weight = 1 },
                new Question { QuestionId = 3, Text = "🔥 You're doom-scrolling at 2am. What makes you stop and actually click?", Type = "multiple", Index = 3, Weight = 1 },
                new Question { QuestionId = 4, Text = "💭 Real talk - which thought do you have most often?", Type = "single", Index = 4, Weight = 1 },
                new Question { QuestionId = 5, Text = "🎯 Your laptop can only run ONE thing for a month. Choose wisely:", Type = "single", Index = 5, Weight = 1 },
                new Question { QuestionId = 6, Text = "🎪 Group project time. Which role do you secretly hope to avoid?", Type = "single", Index = 6, Weight = 1 },
                new Question { QuestionId = 7, Text = "🎬 Five years from now, which headline makes you feel something?", Type = "single", Index = 7, Weight = 1 },
                new Question { QuestionId = 8, Text = "🔮 You get a magic 4-hour block where you're guaranteed to learn anything. What do you pick?", Type = "rank", Index = 8, Weight = 1 },
                new Question { QuestionId = 9, Text = "💬 Your friend asks \"what are you working on?\" - what's your honest answer?", Type = "single", Index = 9, Weight = 1 },
                new Question { QuestionId = 10, Text = "🎯 Real scenario: You just discovered a bug. What's your first actual thought?", Type = "single", Index = 10, Weight = 1 }
            );

            modelBuilder.Entity<Answer>().HasData(
                // Question 1
                new Answer
                {
                    Id = 1,
                    QuestionId = 1,
                    Text = "Training an AI on some weird dataset to see what happens",
                    Weight = 1,
                    MajorPoints = Points(("ΒΥΝ", 4), ("ΚΔΕ", 1)),
                    ToolboxPoints = Points()
                },
                new Answer
                {
                    Id = 2,
                    QuestionId = 1,
                    Text = "Building that app idea that's been living rent-free in your head",
                    Weight = 1,
                    MajorPoints = Points(("ΚΔΕ", 1), ("ΨΜΑΔ", 4)),
                    ToolboxPoints = Points(("TB4", 3))
                },
                new Answer
                {
                    Id = 3,
                    QuestionId = 1,
                    Text = "Setting up a home security lab or trying to crack your own system",
                    Weight = 1,
                    MajorPoints = Points(("ΚΔΕ", 4)),
                    ToolboxPoints = Points(("TB5", 2))
                },
                new Answer
                {
                    Id = 4,
                    QuestionId = 1,
                    Text = "Making something visual/interactive that makes people go \"wait, how'd you do that?\"",
                    Weight = 1,
                    MajorPoints = Points(("ΒΥΝ", 2), ("ΨΜΑΔ", 3)),
                    ToolboxPoints = Points(("TB2", 3))
                },

                // Question 2
                new Answer
                {
                    Id = 5,
                    QuestionId = 2,
                    Text = " When coding, I'm more 1=Theory/Elegant, 10=Practical/Ships",


                    Weight = 1,
                    MajorPoints = Points(),
                    ToolboxPoints = Points(),
                    SliderMin = 1,
                    SliderMax = 10
                },
                

                // Question 3
                new Answer
                {
                    Id = 7,
                    QuestionId = 3,
                    Text = "🤖 \"AI just discovered something doctors missed for 50 years\"",
                    Weight = 1,
                    MajorPoints = Points(("ΒΥΝ", 3)),
                    ToolboxPoints = Points()
                },
                new Answer
                {
                    Id = 8,
                    QuestionId = 3,
                    Text = "💰 \"College dropout's app just hit $10M revenue\"",
                    Weight = 1,
                    MajorPoints = Points(("ΨΜΑΔ", 3)),
                    ToolboxPoints = Points()
                },
                new Answer
                {
                    Id = 9,
                    QuestionId = 3,
                    Text = "🔓 \"How hackers stole $600M in cryptocurrency\"",
                    Weight = 1,
                    MajorPoints = Points(("ΚΔΕ", 3)),
                    ToolboxPoints = Points(("TB5", 3))
                },
                new Answer
                {
                    Id = 10,
                    QuestionId = 3,
                    Text = "🎨 \"The insane tech behind that movie scene\"",
                    Weight = 1,
                    MajorPoints = Points(("ΒΥΝ", 2), ("ΨΜΑΔ", 1)),
                    ToolboxPoints = Points(("TB2", 3))
                },
                new Answer
                {
                    Id = 11,
                    QuestionId = 3,
                    Text = "🧮 \"The beautiful math that makes the internet work\"",
                    Weight = 1,
                    MajorPoints = Points(("ΒΥΝ", 3), ("ΚΔΕ", 1)),
                    ToolboxPoints = Points(("TB1", 3))
                },
                new Answer
                {
                    Id = 12,
                    QuestionId = 3,
                    Text = "📚 \"Why students can't learn [subject] and how to fix it\"",
                    Weight = 1,
                    MajorPoints = Points(("ΨΜΑΔ", 2)),
                    ToolboxPoints = Points(("TB3", 4))
                },

                // Question 4
                new Answer
                {
                    Id = 13,
                    QuestionId = 4,
                    Text = "\"I wonder if I could predict/model/analyze this...\"",
                    Weight = 1,
                    MajorPoints = Points(("ΒΥΝ", 4)),
                    ToolboxPoints = Points()
                },
                new Answer
                {
                    Id = 14,
                    QuestionId = 4,
                    Text = "\"I could build something that solves this problem\"",
                    Weight = 1,
                    MajorPoints = Points(("ΨΜΑΔ", 4)),
                    ToolboxPoints = Points()
                },
                new Answer
                {
                    Id = 15,
                    QuestionId = 4,
                    Text = "\"That's definitely a security risk waiting to happen\"",
                    Weight = 1,
                    MajorPoints = Points(("ΚΔΕ", 4)),
                    ToolboxPoints = Points()
                },
                new Answer
                {
                    Id = 16,
                    QuestionId = 4,
                    Text = "\"Why is this so hard to use? I could make this better\"",
                    Weight = 1,
                    MajorPoints = Points(("ΨΜΑΔ", 3), ("ΒΥΝ", 1)),
                    ToolboxPoints = Points()
                },

                // Question 5
                new Answer
                {
                    Id = 17,
                    QuestionId = 5,
                    Text = "🔬 Jupyter Notebook + unlimited datasets",
                    Weight = 1,
                    MajorPoints = Points(("ΒΥΝ", 4)),
                    ToolboxPoints = Points(("TB1", 2))
                },
                new Answer
                {
                    Id = 18,
                    QuestionId = 5,
                    Text = "☁️ Full cloud deployment setup + API access",
                    Weight = 1,
                    MajorPoints = Points(("ΨΜΑΔ", 4)),
                    ToolboxPoints = Points(("TB4", 4))
                },
                new Answer
                {
                    Id = 19,
                    QuestionId = 5,
                    Text = "🛡️ Kali Linux + all the hacking tools (ethical, obviously)",
                    Weight = 1,
                    MajorPoints = Points(("ΚΔΕ", 4)),
                    ToolboxPoints = Points(("TB5", 4))
                },
                new Answer
                {
                    Id = 20,
                    QuestionId = 5,
                    Text = "🎮 Unity/Unreal Engine OR your favorite creative suite",
                    Weight = 1,
                    MajorPoints = Points(("ΨΜΑΔ", 3), ("ΒΥΝ", 1)),
                    ToolboxPoints = Points(("TB2", 3))
                },

                // Question 6
                new Answer
                {
                    Id = 21,
                    QuestionId = 6,
                    Text = "The 'make it look pretty' person",
                    Weight = 1,
                    MajorPoints = Points(("ΒΥΝ", 3)),
                    ToolboxPoints = Points(("TB2", 2))
                },
                new Answer
                {
                    Id = 22,
                    QuestionId = 6,
                    Text = "The pure researcher",
                    Weight = 1,
                    MajorPoints = Points(("ΨΜΑΔ", 3)),
                    ToolboxPoints = Points(("TB1", 2))
                },
                new Answer
                {
                    Id = 23,
                    QuestionId = 6,
                    Text = "The 'move fast break things' person",
                    Weight = 1,
                    MajorPoints = Points(("ΚΔΕ", 3)),
                    ToolboxPoints = Points(("TB5", 2))
                },
                new Answer
                {
                    Id = 24,
                    QuestionId = 6,
                    Text = "The backend-only person",
                    Weight = 1,
                    MajorPoints = Points(("ΨΜΑΔ", 2), ("ΒΥΝ", 1)),
                    ToolboxPoints = Points(("TB4", 1))
                },

                // Question 7
                new Answer
                {
                    Id = 25,
                    QuestionId = 7,
                    Text = "🧬 Researcher's Algorithm Breakthrough Advances Medicine",
                    Weight = 1,
                    MajorPoints = Points(("ΒΥΝ", 4)),
                    ToolboxPoints = Points()
                },
                new Answer
                {
                    Id = 26,
                    QuestionId = 7,
                    Text = "📈 Startup's Platform Now Serves 10M Users Daily",
                    Weight = 1,
                    MajorPoints = Points(("ΨΜΑΔ", 4)),
                    ToolboxPoints = Points()
                },
                new Answer
                {
                    Id = 27,
                    QuestionId = 7,
                    Text = "🛡️ Security Expert Prevents Billion-Dollar Data Breach",
                    Weight = 1,
                    MajorPoints = Points(("ΚΔΕ", 4)),
                    ToolboxPoints = Points()
                },
                new Answer
                {
                    Id = 28,
                    QuestionId = 7,
                    Text = "🌟 Creator's Work Changes How 100k People Learn/Play",
                    Weight = 1,
                    MajorPoints = Points(("ΨΜΑΔ", 3), ("ΒΥΝ", 1)),
                    ToolboxPoints = Points(("TB2", 2))
                },

                // Question 8
                new Answer
                {
                    Id = 29,
                    QuestionId = 8,
                    Text = "🧠 How to make AI actually intelligent",
                    Weight = 1,
                    MajorPoints = Points(("ΒΥΝ", 4)),
                    ToolboxPoints = Points()
                },
                new Answer
                {
                    Id = 30,
                    QuestionId = 8,
                    Text = "🚀 How to build systems that don't crash",
                    Weight = 1,
                    MajorPoints = Points(("ΨΜΑΔ", 3)),
                    ToolboxPoints = Points(("TB4", 3))
                },
                new Answer
                {
                    Id = 31,
                    QuestionId = 8,
                    Text = "🔐 How hackers think and how to stop them",
                    Weight = 1,
                    MajorPoints = Points(("ΚΔΕ", 4)),
                    ToolboxPoints = Points(("TB5", 4))
                },
                new Answer
                {
                    Id = 32,
                    QuestionId = 8,
                    Text = "🎨 How to make interfaces that feel magical",
                    Weight = 1,
                    MajorPoints = Points(("ΨΜΑΔ", 3), ("ΒΥΝ", 1)),
                    ToolboxPoints = Points(("TB2", 4))
                },
                new Answer
                {
                    Id = 33,
                    QuestionId = 8,
                    Text = "🧮 The deep theory that makes everything else possible",
                    Weight = 1,
                    MajorPoints = Points(("ΒΥΝ", 4)),
                    ToolboxPoints = Points()
                },
                new Answer
                {
                    Id = 34,
                    QuestionId = 8,
                    Text = "👨‍🏫 How to explain complex stuff so anyone can get it",
                    Weight = 1,
                    MajorPoints = Points(("ΨΜΑΔ", 2)),
                    ToolboxPoints = Points(("TB3", 3))
                },

                // Question 9
                new Answer
                {
                    Id = 35,
                    QuestionId = 9,
                    Text = "Launches into the technical details of the algorithm/problem",
                    Weight = 1,
                    MajorPoints = Points(("ΒΥΝ", 4)),
                    ToolboxPoints = Points()
                },
                new Answer
                {
                    Id = 36,
                    QuestionId = 9,
                    Text = "\"Something that could actually be useful for [specific people]\"",
                    Weight = 1,
                    MajorPoints = Points(("ΨΜΑΔ", 4)),
                    ToolboxPoints = Points()
                },
                new Answer
                {
                    Id = 37,
                    QuestionId = 9,
                    Text = "\"Trying to break/secure this system\" shows security logs",
                    Weight = 1,
                    MajorPoints = Points(("ΚΔΕ", 4)),
                    ToolboxPoints = Points(("TB5", 3))
                },
                new Answer
                {
                    Id = 38,
                    QuestionId = 9,
                    Text = "Just shows them the demo/interface \"Check this out!\"",
                    Weight = 1,
                    MajorPoints = Points(("ΨΜΑΔ", 3), ("ΒΥΝ", 1)),
                    ToolboxPoints = Points(("TB2", 4))
                },

                // Question 10
                new Answer
                {
                    Id = 39,
                    QuestionId = 10,
                    Text = "\"Wait... why is it doing THAT? This is actually interesting\"",
                    Weight = 1,
                    MajorPoints = Points(("ΒΥΝ", 4)),
                    ToolboxPoints = Points()
                },
                new Answer
                {
                    Id = 40,
                    QuestionId = 10,
                    Text = "\"Ugh, this delays the launch timeline\"",
                    Weight = 1,
                    MajorPoints = Points(("ΨΜΑΔ", 4)),
                    ToolboxPoints = Points(("TB4", 3))
                },
                new Answer
                {
                    Id = 41,
                    QuestionId = 10,
                    Text = "\"Could someone exploit this? Let me check...\"",
                    Weight = 1,
                    MajorPoints = Points(("ΚΔΕ", 4)),
                    ToolboxPoints = Points(("TB5", 3))
                },
                new Answer
                {
                    Id = 42,
                    QuestionId = 10,
                    Text = "\"How do I explain this to users without causing panic?\"",
                    Weight = 1,
                    MajorPoints = Points(("ΨΜΑΔ", 3), ("ΒΥΝ", 1)),
                    ToolboxPoints = Points(("TB2", 4))
                }

            );
            modelBuilder.Entity<AnswerQuestion>().HasData(
    // Question 1
    new AnswerQuestion { QuestionId = 1, AnswerId = 1 },
    new AnswerQuestion { QuestionId = 1, AnswerId = 2 },
    new AnswerQuestion { QuestionId = 1, AnswerId = 3 },
    new AnswerQuestion { QuestionId = 1, AnswerId = 4 },

    // Question 2
    new AnswerQuestion { QuestionId = 2, AnswerId = 5 },

    // Question 3
    new AnswerQuestion { QuestionId = 3, AnswerId = 7 },
    new AnswerQuestion { QuestionId = 3, AnswerId = 8 },
    new AnswerQuestion { QuestionId = 3, AnswerId = 9 },
    new AnswerQuestion { QuestionId = 3, AnswerId = 10 },
    new AnswerQuestion { QuestionId = 3, AnswerId = 11 },
    new AnswerQuestion { QuestionId = 3, AnswerId = 12 },

    // Question 4
    new AnswerQuestion { QuestionId = 4, AnswerId = 13 },
    new AnswerQuestion { QuestionId = 4, AnswerId = 14 },
    new AnswerQuestion { QuestionId = 4, AnswerId = 15 },
    new AnswerQuestion { QuestionId = 4, AnswerId = 16 },

    // Question 5
    new AnswerQuestion { QuestionId = 5, AnswerId = 17 },
    new AnswerQuestion { QuestionId = 5, AnswerId = 18 },
    new AnswerQuestion { QuestionId = 5, AnswerId = 19 },
    new AnswerQuestion { QuestionId = 5, AnswerId = 20 },

    // Question 6
    new AnswerQuestion { QuestionId = 6, AnswerId = 21 },
    new AnswerQuestion { QuestionId = 6, AnswerId = 22 },
    new AnswerQuestion { QuestionId = 6, AnswerId = 23 },
    new AnswerQuestion { QuestionId = 6, AnswerId = 24 },

    // Question 7
    new AnswerQuestion { QuestionId = 7, AnswerId = 25 },
    new AnswerQuestion { QuestionId = 7, AnswerId = 26 },
    new AnswerQuestion { QuestionId = 7, AnswerId = 27 },
    new AnswerQuestion { QuestionId = 7, AnswerId = 28 },

    // Question 8
    new AnswerQuestion { QuestionId = 8, AnswerId = 29 },
    new AnswerQuestion { QuestionId = 8, AnswerId = 30 },
    new AnswerQuestion { QuestionId = 8, AnswerId = 31 },
    new AnswerQuestion { QuestionId = 8, AnswerId = 32 },
    new AnswerQuestion { QuestionId = 8, AnswerId = 33 },
    new AnswerQuestion { QuestionId = 8, AnswerId = 34 },

    // Question 9
    new AnswerQuestion { QuestionId = 9, AnswerId = 35 },
    new AnswerQuestion { QuestionId = 9, AnswerId = 36 },
    new AnswerQuestion { QuestionId = 9, AnswerId = 37 },
    new AnswerQuestion { QuestionId = 9, AnswerId = 38 },

    // Question 10
    new AnswerQuestion { QuestionId = 10, AnswerId = 39 },
    new AnswerQuestion { QuestionId = 10, AnswerId = 40 },
    new AnswerQuestion { QuestionId = 10, AnswerId = 41 },
    new AnswerQuestion { QuestionId = 10, AnswerId = 42 }
);

        }

        private static Dictionary<string, int> Points(params (string Key, int Value)[] entries)
        {
            var dict = new Dictionary<string, int>();

            foreach (var (key, value) in entries)
            {
                dict[key] = value;
            }

            return dict;
        }
    }
}
