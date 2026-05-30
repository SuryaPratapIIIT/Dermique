import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from agents.router import Router

def main():
    print("=== STARTING CLARA-LITE SYNCHRONOUS AGENTS DEMO ===")
    router = Router()
    
    # 1. User greeting (too vague)
    msg1 = "Hello! I need a skincare routine."
    print(f"\nUser: {msg1}")
    res1 = router.process(msg1)
    print(f"Clara: {res1['response']}")
    print(f"State: {res1['state']} | Profile: {res1['profile']}")
    
    # 2. Complete skin profile details
    msg2 = "I have oily skin and I want to target acne. I am in my 20s, no sensitivities."
    print(f"\nUser: {msg2}")
    res2 = router.process(msg2)
    try:
        print(f"Clara:\n{res2['response']}")
    except UnicodeEncodeError:
        print(f"Clara:\n{res2['response'].encode('ascii', 'ignore').decode('ascii')}")
    print(f"State: {res2['state']} | Profile: {res2['profile']}")

if __name__ == "__main__":
    main()
