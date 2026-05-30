from langfuse import Langfuse
import os
from dotenv import load_dotenv

class LangfuseLogger:
    def __init__(self):
        load_dotenv()
        self.client = Langfuse(
            public_key=os.getenv("LANGFUSE_PUBLIC_KEY"),
            secret_key=os.getenv("LANGFUSE_SECRET_KEY"),
            host=os.getenv("LANGFUSE_HOST")
        )

    def log_agent_call(self, agent_name, input_text, output_text, 
                       latency_ms, token_count=None):
        try:
            trace = self.client.trace(name=f"clara-{agent_name}")
            span = trace.span(
                name=agent_name,
                input=input_text,
                output=output_text,
                metadata={"latency_ms": latency_ms, "tokens": token_count}
            )
            span.end()
            self.client.flush()
            print(f"Logged to Langfuse: {agent_name} | {latency_ms}ms")
        except Exception as e:
            print(f"Langfuse logging error: {e}")
