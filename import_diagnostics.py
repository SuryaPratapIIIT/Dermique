import sys
import os
import traceback

print("agents folder contents:")
try:
    print(os.listdir("agents"))
except Exception as e:
    print("Error listing agents:", e)

try:
    print("Attempting to import agents...")
    import agents
    print("Successfully imported agents:", agents)
except Exception as e:
    print("Failed importing agents:")
    traceback.print_exc()

try:
    print("Attempting to import agents.intake_agent...")
    import agents.intake_agent
    print("Successfully imported agents.intake_agent!")
except Exception as e:
    print("Failed importing agents.intake_agent:")
    traceback.print_exc()

try:
    print("Attempting to import agents.router...")
    import agents.router
    print("Successfully imported agents.router!")
except Exception as e:
    print("Failed importing agents.router:")
    traceback.print_exc()
