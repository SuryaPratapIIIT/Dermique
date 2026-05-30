import sys
import os
print("CWD:", os.getcwd())
print("sys.path:")
for p in sys.path:
    print(" -", p)
print("List dir:")
print(os.listdir(os.getcwd()))
try:
    from agents.router import Router
    print("Success importing Router!")
except Exception as e:
    import traceback
    traceback.print_exc()
