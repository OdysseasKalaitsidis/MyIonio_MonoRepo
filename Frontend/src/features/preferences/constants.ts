export const DEPARTMENTS = [
    { id: 1, name: "Informatics", greekName: "Τμήμα Πληροφορικής" },
    { id: 2, name: "Tourism", greekName: "Τμήμα Τουρισμού" },
    { id: 3, name: "Translation", greekName: "Τμήμα Ξένων Γλωσσών, Μετάφρασης και Διερμηνείας" }
];

export const DEPARTMENT_MAP: Record<string, string> = {
    "Informatics": "Τμήμα Πληροφορικής",
    "Department of Informatics": "Τμήμα Πληροφορικής",
    "Tourism": "Τμήμα Τουρισμού",
    "Translation": "Τμήμα Ξένων Γλωσσών, Μετάφρασης και Διερμηνείας"
};

export const DEPARTMENT_ID_MAP: Record<string, number> = {
    "Informatics": 1,
    "Department of Informatics": 1,
    "Tourism": 2,
    "Translation": 3
};

// Map Greek letters to semester numbers for API compatibility
export const SEMESTER_TO_NUMBER: Record<string, number> = {
    "Α": 1,
    "Β": 2,
    "Γ": 3,
    "Δ": 4,
    "Ε": 5,
    "ΣΤ": 6,
    "Ζ": 7,
    "Η": 8
};

export const semesterIdFromValue = (value: string | number | null | undefined): number | null => {
    if (value == null) return null;
    const text = String(value).trim().toUpperCase().replaceAll("΄", "").replaceAll("'", "");
    const aliases: Record<string, number> = {
        "1": 1, "A": 1, "Α": 1, "2": 2, "B": 2, "Β": 2,
        "3": 3, "C": 3, "Γ": 3, "4": 4, "D": 4, "Δ": 4,
        "5": 5, "E": 5, "Ε": 5, "6": 6, "F": 6, "ΣΤ": 6,
        "7": 7, "G": 7, "Z": 7, "Ζ": 7, "8": 8, "H": 8, "Η": 8,
    };
    return aliases[text] ?? null;
};

export const SEMESTERS = [
    { id: 1, code: "Α" }, { id: 2, code: "Β" }, { id: 3, code: "Γ" }, { id: 4, code: "Δ" },
    { id: 5, code: "Ε" }, { id: 6, code: "ΣΤ" }, { id: 7, code: "Ζ" }, { id: 8, code: "Η" },
] as const;

export const ACTIVE_SEMESTER_IDS = [1, 3, 5, 7] as const;
export const ACTIVE_SEMESTERS = SEMESTERS.filter((semester) =>
    ACTIVE_SEMESTER_IDS.some((id) => id === semester.id));

export const DEPARTMENTS_LIST = Object.keys(DEPARTMENT_MAP);
