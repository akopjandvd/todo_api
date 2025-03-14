from fastapi import FastAPI, Depends, Security
from fastapi.security import HTTPBearer
from routes import auth, tasks


app = FastAPI()

# Beállítjuk a Swagger UI számára a helyes hitelesítési formát
security_scheme = HTTPBearer()


app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
