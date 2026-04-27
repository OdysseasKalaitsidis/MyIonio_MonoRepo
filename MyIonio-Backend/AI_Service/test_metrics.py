"""
Example script showing how to use token metrics tracking.

This demonstrates:
1. Per-request metrics (attached to response)
2. Global metrics tracking across multiple requests
3. Cost calculations
"""

from parser.gemini_parser import (
    parse_schedule_with_gemini, 
    get_global_metrics,
    reset_global_metrics
)
from pathlib import Path
import json


def main():
    print("📊 TOKEN METRICS DEMO\n")
    print("=" * 80)
    
    # Reset metrics from any previous runs
    reset_global_metrics()
    
    # Parse a PDF
    pdf_path = Path("Ωρολόγιο Πρόγραμμα Δ΄ Εξαμήνου - Ακαδημαϊκό έτος 2025-2026.pdf")
    
    if not pdf_path.exists():
        print(f"❌ PDF not found: {pdf_path}")
        return
    
    print(f"Parsing: {pdf_path.name}\n")
    
    # Parse with metrics tracking enabled (default)
    result = parse_schedule_with_gemini(str(pdf_path), dpi=200, track_metrics=True)
    
    # Check if metrics are available
    if '_metrics' in result:
        metrics = result['_metrics']
        
        print("\n" + "=" * 80)
        print("📈 PER-REQUEST METRICS")
        print("=" * 80)
        print(f"Input Tokens:  {metrics['input_tokens']:,}")
        print(f"Output Tokens: {metrics['output_tokens']:,}")
        print(f"Total Tokens:  {metrics['total_tokens']:,}")
        print(f"\nInput Cost:    ${metrics['input_cost_usd']:.6f}")
        print(f"Output Cost:   ${metrics['output_cost_usd']:.6f}")
        print(f"Total Cost:    ${metrics['total_cost_usd']:.6f}")
        
        # Calculate cost for 100 PDFs
        cost_100 = metrics['total_cost_usd'] * 100
        print(f"\n💰 Projected cost for 100 similar PDFs: ${cost_100:.4f}")
    
    # Global metrics (tracks all requests in the session)
    print("\n" + "=" * 80)
    print("🌍 GLOBAL METRICS (All Requests)")
    print("=" * 80)
    print(get_global_metrics())
    
    # Save result without metrics
    clean_result = {k: v for k, v in result.items() if k != '_metrics'}
    with open('output_with_metrics.json', 'w', encoding='utf-8') as f:
        json.dump(clean_result, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Data saved to: output_with_metrics.json")
    print("\nNote: The '_metrics' field is automatically added to responses.")
    print("      You can disable this with track_metrics=False")


if __name__ == "__main__":
    main()
