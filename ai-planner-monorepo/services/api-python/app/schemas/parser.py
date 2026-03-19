from pydantic import BaseModel, Field


class TextCommandRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)
    

                      
                      
                      