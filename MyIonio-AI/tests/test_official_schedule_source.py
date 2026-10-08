import unittest

from pipeline.official_schedule_source import OfficialSourceError, official_pdf_identity, parse_schedule_page


class OfficialScheduleSourceTests(unittest.TestCase):
    def test_parses_supported_semesters_and_pipeline_types(self):
        html = """
        <a href="https://ionio.gr/download.php?f=01000-01999%2Fa.pdf">
          Ωρολόγιο Πρόγραμμα Α Εξαμήνου - Ακαδημαϊκό έτος 2026 - 2027 [25.09.2026]
        </a>
        <a href="https://ionio.gr/download.php?f=01000-01999%2Fz.pdf">
          Ωρολόγιο Πρόγραμμα Ζ Εξαμήνου - Ακαδημαϊκό έτος 2026 - 2027 [25.09.2026]
        </a>
        """
        documents = parse_schedule_page(html)
        self.assertEqual([item.semester_id for item in documents], [1, 7])
        self.assertEqual(documents[0].document_type, "class_schedule_simple")
        self.assertEqual(documents[1].document_type, "class_schedule_split")
        self.assertEqual(documents[1].academic_year, "2026-2027")
        self.assertEqual(documents[1].published_date, "25.09.2026")

    def test_rejects_non_official_download_host(self):
        html = """
        <a href="https://example.com/download.php?f=z.pdf">
          Ωρολόγιο Πρόγραμμα Ζ Εξαμήνου - Ακαδημαϊκό έτος 2026 - 2027
        </a>
        """
        with self.assertRaises(OfficialSourceError):
            parse_schedule_page(html)

    def test_encoded_and_decoded_file_query_have_same_identity(self):
        encoded = "https://ionio.gr/download.php?f=01000-01999%2Ffile.pdf"
        decoded = "https://ionio.gr/download.php?f=01000-01999/file.pdf"
        self.assertEqual(official_pdf_identity(encoded), official_pdf_identity(decoded))


if __name__ == "__main__":
    unittest.main()
