import os
from pathlib import Path

# List of folders to exclude (dependencies, builds, etc.)
excluded_dirs = [
    'node_modules', '.next', 'out', 'build', '.idea', '.bsp', '.metals',
    '.git', 'logs', 'dist', '.cache', 'coverage', 'public', '.vscode',
    '.bloop', '.sbt', '.ivy2', '.coursier', 'storybook-static', '__pycache__'
]

# List of file extensions and specific files to include
included_extensions = [
    '.js', '.jsx', '.ts', '.tsx',  # JavaScript and TypeScript source files
    '.py', '.ipynb',  # Python source and notebook files
    '.json',  # JSON files (e.g., tsconfig.json, eslint.json)
    '.css', '.scss',  # Style files
    '.env',  # Environment variables
    '.config.js', '.config.ts', '.config.py',  # Configuration files
    'package.json', 'package-lock.json', 'yarn.lock',  # Dependency files
    # Python dependency files
    'requirements.txt', 'Pipfile', 'Pipfile.lock', 'pyproject.toml',
    'next.config.js', 'next.config.mjs'  # Next.js config files
]

# Load .gitignore patterns


def load_gitignore_patterns():
    gitignore_path = Path(".gitignore")
    if gitignore_path.exists():
        with open(gitignore_path, "r", encoding="utf-8") as f:
            patterns = [line.strip() for line in f if line.strip()
                        and not line.startswith("#")]
        return patterns
    return []

# Check if a file is ignored based on .gitignore patterns


def is_ignored(filepath, patterns):
    try:
        relative_filepath = filepath.relative_to(Path.cwd())
    except ValueError:
        return False
    for pattern in patterns:
        if relative_filepath.match(pattern):
            return True
    return False


# Define the directory containing your files
root_dir = "."

# Load gitignore patterns
ignore_patterns = load_gitignore_patterns()

# Open a new text file to write the combined contents
with open("project_source.txt", "w", encoding="utf-8") as outfile:
    # Walk through all directories and files
    for subdir, dirs, files in os.walk(root_dir):
        # Skip excluded directories
        dirs[:] = [d for d in dirs if d not in excluded_dirs]

        for file in files:
            filepath = Path(subdir) / file
            # Check if the file has the correct extension or is a specific included file
            if any(str(filepath).endswith(ext) for ext in included_extensions) and not is_ignored(filepath, ignore_patterns):
                try:
                    with open(filepath, "r", encoding="utf-8") as infile:
                        outfile.write(f"\n--- Start of {filepath} ---\n")
                        outfile.write(infile.read())
                        outfile.write(f"\n--- End of {filepath} ---\n")
                except Exception as e:
                    # Print error message
                    print(f"Error reading {filepath}: {e}")

print("Relevant project files have been combined into project_source.txt")
