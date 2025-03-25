from fastapi import FastAPI, Response
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from fastapi.security import HTTPBearer
from routes import auth, tasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse


limiter = Limiter(key_func=get_remote_address)


app = FastAPI()

app.state.limiter = limiter
# Rate limit exception handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse(status_code=429, content={"detail": "Too many requests"})

app.add_middleware(
    CORSMiddleware,
    #allow_origins=["http://localhost:5173"], 
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

@app.head("/")
def healthcheck_head():
    return Response(status_code=200)