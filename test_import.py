import sys
print("Python path:")
for path in sys.path:
    print(path)

print("\nTrying to import database...")
try:
    import database
    print("Successfully imported database")
except ImportError as e:
    print(f"Failed to import database: {e}")

print("\nCurrent working directory:")
import os
print(os.getcwd()) 