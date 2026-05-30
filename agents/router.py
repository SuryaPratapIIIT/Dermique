from agents.intake_agent import IntakeAgent
from agents.recommender_agent import RecommenderAgent
from agents.vision_agent import VisionAgent
from utils.langfuse_logger import LangfuseLogger
import time

class Router:
    def __init__(self):
        self.intake = IntakeAgent()
        self.recommender = RecommenderAgent()
        self.vision = VisionAgent()
        self.logger = LangfuseLogger()
        self.state = "INTAKE"
        self.conversation_history = []
        self.profile = None


    def process(self, user_message: str) -> dict:
        # Append user message to history:
        self.conversation_history.append(
            {"role": "user", "content": user_message}
        )

        if self.state == "DONE":
            # Reset state to allow follow-up questions or new profiles
            self.state = "INTAKE"

        if self.state == "INTAKE":
            result = self.intake.analyze(user_message, self.conversation_history)
            
            # Log to Langfuse:
            self.logger.log_agent_call(
                agent_name="IntakeAgent",
                input_text=user_message,
                output_text=str(result),
                latency_ms=result.get("latency_ms", 0)
            )
            
            if result["ready"] is False:
                reply = result["question"]
                # Append reply to history.
                self.conversation_history.append(
                    {"role": "assistant", "content": reply}
                )
                return {"response": reply, "state": "INTAKE", "profile": None}
            
            if result["ready"] is True:
                self.profile = result
                self.state = "RECOMMENDING"
                
                rec = self.recommender.recommend(self.profile)
                
                # Log to Langfuse:
                self.logger.log_agent_call(
                    agent_name="RecommenderAgent",
                    input_text=str(self.profile),
                    output_text=rec["response"],
                    latency_ms=rec["latency_ms"],
                    token_count=rec["tokens"]
                )
                
                self.state = "DONE"
                # Append rec["response"] to history.
                self.conversation_history.append(
                    {"role": "assistant", "content": rec["response"]}
                )
                return {
                    "response": rec["response"], 
                    "state": "DONE", 
                    "profile": self.profile,
                    "products": rec.get("products")
                }
        
        return {"response": "How can I help you?", "state": self.state, "profile": self.profile}

    def process_image(self, image_input: str) -> dict:
        result = self.vision.analyze_skin_image(image_input)
        
        # Log to Langfuse:
        self.logger.log_agent_call(
            agent_name="VisionAgent",
            input_text="[Image Uploaded]",
            output_text=str(result),
            latency_ms=result.get("latency_ms", 0)
        )
        
        if result.get("ready") is False or result.get("error"):
            reply = result.get("message", "Could not analyze skin from this image. Please upload a clear face photo.")
            self.conversation_history.append(
                {"role": "assistant", "content": reply}
            )
            return {"response": reply, "state": "INTAKE", "profile": None}
            
        if result.get("ready") is True:
            self.profile = result
            self.state = "RECOMMENDING"
            
            rec = self.recommender.recommend(self.profile)
            
            # Log to Langfuse:
            self.logger.log_agent_call(
                agent_name="RecommenderAgent",
                input_text=str(self.profile),
                output_text=rec["response"],
                latency_ms=rec["latency_ms"],
                token_count=rec["tokens"]
            )
            
            self.state = "DONE"
            self.conversation_history.append(
                {"role": "assistant", "content": rec["response"]}
            )
            return {
                "response": rec["response"], 
                "state": "DONE", 
                "profile": self.profile,
                "products": rec.get("products")
            }
            
        return {"response": "How can I help you?", "state": self.state, "profile": self.profile}

