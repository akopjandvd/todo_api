from fastapi import FastAPI, Depends, Security
from fastapi.security import HTTPBearer
from routes import auth, tasks
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://todo-api-kpjn.vercel.app"],  # vagy ["http://localhost:5173"] fejlesztéshez
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Beállítjuk a Swagger UI számára a helyes hitelesítési formát
security_scheme = HTTPBearer()


app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])

@app.get("/")
def root():
    return {"message": "API is up and running!"}