# 1. Alap image
FROM python:3.10.11-slim

# 2. Munkakönyvtár beállítása
WORKDIR /app

# 3. Másoljuk a függőségeket és telepítsük
COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# 4. Másoljuk be az egész appot
COPY . .

# 5. Alapértelmezett parancs
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
