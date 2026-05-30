import subprocess

print("Checking last commit files...")
try:
    show_output = subprocess.check_output("git show e9e1f4f --name-status", shell=True, text=True)
    print("\n--- git show e9e1f4f --name-status ---")
    print(show_output)
except Exception as e:
    print("Error:", e)
