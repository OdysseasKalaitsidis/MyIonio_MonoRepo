import unittest
from unittest.mock import MagicMock, patch
from parser.menu_parser import parse_menu
from PIL import Image
import os
import sys

# Ensure the parent directory is in the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

class TestMenuParser(unittest.TestCase):

    def test_parse_menu_invalid_extension(self):
        """Test that parse_menu raises ValueError for invalid extensions."""
        with self.assertRaises(ValueError) as cm:
            parse_menu("test.txt")
        self.assertIn("Invalid file format", str(cm.exception))

    @patch("parser.menu_parser.pdf_to_images")
    @patch("parser.menu_parser.genai.Client")
    @patch("os.getenv")
    def test_parse_menu_pdf(self, mock_getenv, mock_client, mock_pdf_to_images):
        """Test parsing a PDF file."""
        mock_getenv.return_value = "fake_key"
        mock_pdf_to_images.return_value = [MagicMock()] # Return a mock image
        
        # Mock Gemini response
        mock_response = MagicMock()
        mock_response.text = '{"week_start": "2025-03-17", "week_end": "2025-03-23", "days": []}'
        mock_client.return_value.models.generate_content.return_value = mock_response

        # We mock the return value of _map_json_to_objects or just let it run if it's simple
        # Since _map_json_to_objects is imported inside parse_menu or used there, 
        # but wait, _map_json_to_objects is a function in the same module.
        # If I mock genai.Client response to return valid JSON, it should be fine.
        
        # However, _map_json_to_objects uses Pydantic/Data classes. 
        # Let's ensure the JSON structure matches what _map_json_to_objects expects.
        
        result = parse_menu("test.pdf")
        
        self.assertTrue(mock_pdf_to_images.called)
        self.assertEqual(result.week_start, "2025-03-17")

    @patch("parser.menu_parser.Image.open")
    @patch("parser.menu_parser.genai.Client")
    @patch("os.getenv")
    def test_parse_menu_image(self, mock_getenv, mock_client, mock_image_open):
        """Test parsing an image file."""
        mock_getenv.return_value = "fake_key"
        mock_image_open.return_value = MagicMock() # Return a mock image
        
        # Mock Gemini response
        mock_response = MagicMock()
        mock_response.text = '{"week_start": "2025-03-17", "week_end": "2025-03-23", "days": []}'
        mock_client.return_value.models.generate_content.return_value = mock_response

        # Mock os.path.exists to return True? No, parse_menu doesn't check existence first, 
        # it just does endsWith checks and then tries to open. 
        # Image.open will be mocked.
        
        result = parse_menu("test.png")
        
        self.assertTrue(mock_image_open.called)
        self.assertEqual(result.week_start, "2025-03-17")

if __name__ == "__main__":
    unittest.main()
