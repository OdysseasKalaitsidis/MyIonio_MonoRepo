try:
    with open('build_output.txt', 'r', encoding='utf-16') as f:
        for line in f:
            if ": error" in line:
                print(line.strip())
except Exception as e:
    print(f"Error reading file: {e}")
