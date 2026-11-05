import sys
import os

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app, seed_demo_accounts
from fastapi.testclient import TestClient

def test_all():
    seed_demo_accounts()
    with TestClient(app) as client:
        print("--- 1. Testing Root Endpoint ---")
        res = client.get("/")
        assert res.status_code == 200, res.text
        print("Root response:", res.json())

    print("\n--- 2. Testing Dashboard Stats ---")
    res = client.get("/dashboard/stats")
    assert res.status_code == 200, res.text
    print("Dashboard stats:", res.json())

    print("\n--- 3. Testing Topics Endpoint ---")
    res = client.get("/topics")
    assert res.status_code == 200, res.text
    topics = res.json()
    print(f"Loaded {len(topics)} topics:", [t["name"] for t in topics])

    print("\n--- 4. Testing Researchers Endpoint ---")
    res = client.get("/researchers")
    assert res.status_code == 200, res.text
    researchers_data = res.json()
    print(f"Loaded {researchers_data['total']} researchers:", [r["name"] for r in researchers_data["researchers"]])

    print("\n--- 5. Testing Papers List Endpoint ---")
    res = client.get("/papers?page=1&page_size=10")
    assert res.status_code == 200, res.text
    papers_data = res.json()
    print(f"Loaded {papers_data['total']} papers:")
    for p in papers_data["papers"]:
        print(f"  - [{p['id']}] {p['title']} ({p['publicationYear']}) - Citations: {p['citationCount']}")

    print("\n--- 6. Testing Single Paper Details ---")
    res = client.get("/papers/1")
    assert res.status_code == 200, res.text
    p1 = res.json()
    print("Paper 1 Authors:", [a["name"] for a in p1["authors"]])
    print("Paper 1 Topics:", [t["name"] for t in p1["topics"]])

    print("\n--- 7. Testing Citation Network Endpoint ---")
    res = client.get("/citations/network?paper_id=1")
    assert res.status_code == 200, res.text
    cit = res.json()
    print(f"Paper 1 is cited by {len(cit['citedBy'])} papers: {[p['title'] for p in cit['citedBy']]}")
    print(f"Paper 1 references {len(cit['references'])} papers: {[p['title'] for p in cit['references']]}")

    print("\n--- 8. Testing Authentication (Login) ---")
    login_res = client.post("/auth/login", json={"email": "aarav.demo@researchhub.test", "password": "password123"})
    assert login_res.status_code == 200, login_res.text
    login_data = login_res.json()
    token = login_data["access_token"]
    user = login_data["user"]
    print(f"Logged in as: {user['name']} (Role: {user['role']})")

    headers = {"Authorization": f"Bearer {token}"}

    print("\n--- 9. Testing Authenticated /users/me ---")
    res = client.get("/users/me", headers=headers)
    assert res.status_code == 200, res.text
    print("Current User Profile:", res.json())

    print("\n--- 10. Testing /users/me/papers ---")
    res = client.get("/users/me/papers", headers=headers)
    assert res.status_code == 200, res.text
    my_papers = res.json()
    print(f"User has {my_papers['total']} authored papers.")

    print("\n--- 11. Testing Semantic Vector Recommendations ---")
    res = client.get("/recommendations", headers=headers)
    assert res.status_code == 200, res.text
    recs = res.json()
    print(f"Received {recs['total']} personalized recommendations:")
    for r in recs["recommendations"][:3]:
        print(f"  * {r['paper']['title']} (Score: {r['similarityScore']}) - Reason: {r['reason']}")

    print("\n--- 12. Testing Admin Login and Overview ---")
    admin_login = client.post("/auth/login", json={"email": "admin@researchhub.test", "password": "admin123"})
    assert admin_login.status_code == 200, admin_login.text
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    res = client.get("/admin/overview", headers=admin_headers)
    assert res.status_code == 200, res.text
    print("Admin overview stats:", res.json())

    res = client.get("/admin/users", headers=admin_headers)
    assert res.status_code == 200, res.text
    print(f"Admin users count: {res.json()['total']}")

    print("\n--- 13. Testing Graph Stats Endpoint ---")
    res = client.get("/graph/stats")
    assert res.status_code == 200, res.text
    print("Graph stats:", res.json())

    print("\n--- 14. Testing Transactional Paper Creation (POST /papers) ---")
    new_paper_payload = {
        "title": "Quantum Neural Algorithms for Graph Representation Learning",
        "abstract": "This research investigates variational quantum circuits and neural graph representations for large-scale relational learning.",
        "publicationYear": 2026,
        "doi": "10.5555/researchhub.demo.2026.01",
        "venue": "IEEE Transactions on Neural Networks",
        "topicIds": [1, 2],
        "authorIds": [user["id"]]
    }
    create_res = client.post("/papers", json=new_paper_payload, headers=headers)
    assert create_res.status_code == 201, create_res.text
    created = create_res.json()
    print(f"Created paper ID {created['id']}: {created['title']}")
    print(f"Authors: {[a['name'] for a in created['authors']]}")
    print(f"Topics: {[t['name'] for t in created['topics']]}")

    print("\nALL BACKEND API TESTS PASSED SUCCESSFULLY! ALL CONTRACTS VERIFIED!")

if __name__ == "__main__":
    test_all()
