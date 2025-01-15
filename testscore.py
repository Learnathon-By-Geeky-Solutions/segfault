import os
import subprocess
import sys


def run_command(command, description, fail_on_error=True):
    """Runs a shell command and displays its output."""
    print(f"\n==> Running: {description}")
    result = subprocess.run(
        command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    output = result.stdout.decode()
    error = result.stderr.decode()
    print(output)
    if result.returncode != 0 and fail_on_error:
        print(f"Error: {error}")
        sys.exit(result.returncode)
    return output


def main():
    project_dir = os.path.abspath(os.path.dirname(__file__))
    backend_dir = os.path.join(project_dir, "backend", "codesirius")

    print("========== TESTING SCORES ==========")

    # 1. Coverage
    print("\n[1/4] Calculating Test Coverage...")
    run_command(
        f"coverage run --source={backend_dir} backend/codesirius/manage.py test",
        "Test Coverage",
    )
    run_command("coverage report", "Coverage Report")
    run_command("coverage html", "Generate HTML Coverage Report")

    # 2. Bugs & Vulnerabilities
    print("\n[2/4] Checking for Bugs and Vulnerabilities...")
    run_command(f"bandit -r {backend_dir}", "Bandit Security Analysis")

    # 3. Code Smells
    print("\n[3/4] Analyzing Code Smells...")
    run_command(f"pylint {backend_dir}", "Pylint Code Quality Analysis")

    # 4. Complexity
    print("\n[4/4] Measuring Code Complexity...")
    run_command(f"radon cc {backend_dir} -a", "Cyclomatic Complexity Analysis")

    print("\n========== ANALYSIS COMPLETED ==========")
    print("Generated Reports:")
    print("- Coverage HTML Report: Open `htmlcov/index.html`")
    print("- Bandit Security Analysis: See above.")
    print("- Pylint Code Quality Analysis: See above.")
    print("- Radon Complexity Analysis: See above.")


if __name__ == "__main__":
    main()
