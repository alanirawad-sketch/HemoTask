from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router

app = FastAPI(title="HemoTask API")

# ✅ CORS (REQUIRED for GitHub Pages)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # you can restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ API routes
app.include_router(router)

# ✅ Health check (recommended for Render)
@app.get("/")
def root():
    return {"status": "HemoTask API running"}
