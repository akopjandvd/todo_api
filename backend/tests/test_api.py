import sys
import os
import time
import pytest
from fastapi.testclient import TestClient

# Hozzáadjuk a projekt gyökérkönyvtárát a Python path-hoz
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app


@pytest.fixture(scope="session")
def auth_token():
    login_response = client.post("/auth/token", json={"username": "testtest", "password": "Test123+"})
    assert login_response.status_code == 200
    return login_response.json()["access_token"]


client = TestClient(app)  # FastAPI teszt kliens

def test_register_user():
    response = client.post("/auth/register", json={"username": "testtest", "password": "Test123+"})
    assert response.status_code in [200, 201, 400]  # Ha már létezik, akkor 400

def test_login():
    response = client.post("/auth/token", json={"username": "testtest", "password": "Test123+"})
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_create_task(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}

    response = client.post("/tasks/", json={
        "title": "Learn FastAPI",
        "description": "Understand APIs",
        "completed": False,
        "due_date": "2025-03-31T21:49:26.484Z",
        "priority" : "low"
    }, headers=headers)

    assert response.status_code == 200
    assert response.json()["title"] == "Learn FastAPI"

def test_create_task_without_token():
    response = client.post("/tasks/", json={
        "title": "Unauthorized Task",
        "description": "Should fail",
        "completed": False
    })

    assert response.status_code == 401

def test_get_tasks(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}

    response = client.get("/tasks/", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_update_task(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}

    create_response = client.post("/tasks/", json={
        "title": "Initial Task",
        "description": "Will be updated",
        "completed": False,
        "due_date": "2025-03-31T21:49:26.484Z",
        "priority" : "low"
    }, headers=headers)

    task_id = create_response.json()["id"]

    response = client.put(f"/tasks/{task_id}", json={
        "title": "Updated Task",
        "description": "Task has been updated",
        "completed": True,
        "due_date": "2025-03-31T21:49:26.484Z",
        "priority" : "high"
    }, headers=headers)

    assert response.status_code == 200
    assert response.json()["title"] == "Updated Task"

def test_update_task_not_found(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}

    response = client.put("/tasks/9999", json={
        "title": "Task",
        "description": "Should fail",
        "completed": True,
        "due_date": "2025-03-31T21:49:26.484Z",
        "priority" : "low"
    }, headers=headers)

    assert response.status_code == 404

def test_delete_task(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}

    create_response = client.post("/tasks/", json={
        "title": "Task to delete",
        "description": "Will be deleted",
        "completed": False,
        "due_date": "2025-03-31T21:49:26.484Z",
        "priority" : "low"
    }, headers=headers)

    task_id = create_response.json()["id"]

    response = client.delete(f"/tasks/{task_id}", headers=headers)
    assert response.status_code == 200
    assert response.json() == {"message": "Task deleted"}

def test_delete_task_not_found(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}

    response = client.delete("/tasks/9999", headers=headers)
    assert response.status_code == 404

def test_create_task_without_title(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.post("/tasks/", json={
        "description": "Missing title",
        "priority": "low"
    }, headers=headers)

    assert response.status_code == 422 

def test_create_task_with_long_description(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    long_desc = "x" * 301
    response = client.post("/tasks/", json={
        "title": "Too long",
        "description": long_desc,
        "priority": "low"
    }, headers=headers)

    assert response.status_code == 422 or response.status_code == 400

def test_create_task_with_invalid_date(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.post("/tasks/", json={
        "title": "Invalid date",
        "description": "Some desc",
        "due_date": "not-a-date",
        "priority": "low"
    }, headers=headers)

    assert response.status_code == 422

def test_create_task_with_invalid_priority(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.post("/tasks/", json={
        "title": "Bad priority",
        "description": "Some desc",
        "priority": "urgent"  # invalid
    }, headers=headers)

    assert response.status_code == 422



def test_login_wrong_password():
    response = client.post("/auth/token", json={"username": "testtest", "password": "wrongpassword"})
    assert response.status_code == 401

def test_login_empty_fields():
    response = client.post("/auth/token", json={"username": "", "password": ""})
    assert response.status_code == 401

def test_register_weak_password():
    response = client.post("/auth/register", json={"username": "weakuser", "password": "123"})
    assert response.status_code == 400

def test_brute_force_limit():
    for _ in range(5):
        client.post("/auth/token", json={"username": "testtest", "password": "wrongpassword"})
    response = client.post("/auth/token", json={"username": "testtest", "password": "wrongpassword"})
    assert response.status_code == 429
