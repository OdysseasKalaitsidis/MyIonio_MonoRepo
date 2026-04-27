export const DEPARTMENT_MAP: Record<string, string> = {
    "Informatics": "Τμήμα Πληροφορικής",
    "Tourism": "Τμήμα Τουρισμού",
    "Translation": "Τμήμα Ξένων Γλωσσών, Μετάφρασης και Διερμηνείας"
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

export const DEPARTMENTS_LIST = Object.keys(DEPARTMENT_MAP);

