import sys
import os
import pytest
from fastapi.testclient import TestClient

# Hozzáadjuk a projekt gyökérkönyvtárát a Python path-hoz
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app

client = TestClient(app)  # FastAPI teszt kliens

def test_register_user():
    response = client.post("/auth/register", json={"username": "testuser", "password": "password123"})
    assert response.status_code in [200, 400]  # Ha már létezik, akkor 400

def test_login():
    response = client.post("/auth/token", json={"username": "testuser", "password": "password123"})
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_wrong_password():
    response = client.post("/auth/token", json={"username": "testuser", "password": "wrongpassword"})
    assert response.status_code == 401

def test_create_task():
    login_response = client.post("/auth/token", json={"username": "testuser", "password": "password123"})
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post("/tasks/", json={
        "title": "Learn FastAPI",
        "description": "Understand APIs",
        "completed": False
    }, headers=headers)
    
    assert response.status_code == 200
    assert response.json()["title"] == "Learn FastAPI"

def test_create_task_without_token():
    response = client.post("/tasks/", json={
        "title": "Unauthorized Task",
        "description": "Should fail",
        "completed": False
    })
    
    print("\nResponse Status Code:", response.status_code)  # Kiírjuk a státuszkódot
    print("Response Body:", response.json())  # Kiírjuk az API válaszát
    
    assert response.status_code == 401  # Ha itt 403 jön, az API hibásan kezel valamit




def test_get_tasks():
    login_response = client.post("/auth/token", json={"username": "testuser", "password": "password123"})
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/tasks/", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_update_task():
    login_response = client.post("/auth/token", json={"username": "testuser", "password": "password123"})
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_response = client.post("/tasks/", json={
        "title": "Initial Task",
        "description": "Will be updated",
        "completed": False
    }, headers=headers)

    task_id = create_response.json()["id"]

    response = client.put(f"/tasks/{task_id}", json={
        "title": "Updated Task",
        "description": "Task has been updated",
        "completed": True
    }, headers=headers)

    assert response.status_code == 200
    assert response.json()["title"] == "Updated Task"

def test_update_task_not_found():
    login_response = client.post("/auth/token", json={"username": "testuser", "password": "password123"})
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.put("/tasks/9999", json={
        "title": "Task",
        "description": "Should fail",
        "completed": True
    }, headers=headers)

    assert response.status_code == 404

def test_delete_task():
    login_response = client.post("/auth/token", json={"username": "testuser", "password": "password123"})
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_response = client.post("/tasks/", json={
        "title": "Task to delete",
        "description": "Will be deleted",
        "completed": False
    }, headers=headers)

    task_id = create_response.json()["id"]

    response = client.delete(f"/tasks/{task_id}", headers=headers)
    assert response.status_code == 200
    assert response.json() == {"message": "Task deleted"}

def test_delete_task_not_found():
    login_response = client.post("/auth/token", json={"username": "testuser", "password": "password123"})
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.delete("/tasks/9999", headers=headers)
    assert response.status_code == 404
