from database import engine, Base
import models

# Ez létrehozza az adatbázis táblákat
Base.metadata.create_all(bind=engine)

print("Database initialized successfully!")
