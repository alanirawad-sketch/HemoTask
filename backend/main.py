from fastapi import FastAPI
from routes import router

app = FastAPI(title="HemoTask API")

app.include_router(router)
