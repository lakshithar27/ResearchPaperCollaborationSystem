import asyncio
import logging
import random
from datetime import datetime
from contextlib import asynccontextmanager
from typing import Optional
from pydantic import BaseModel
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from config import CORS_ORIGINS
from database import execute_query, execute_modify
from auth import hash_password
from graph_db import neo4j_service
from realtime import realtime_manager

# Import Routers
from routers.auth_routes import router as auth_router
from routers.users_routes import router as users_router
from routers.papers_routes import router as papers_router
from routers.researchers_routes import router as researchers_router
from routers.topics_routes import router as topics_router
from routers.citations_routes import router as citations_router
from routers.recommendations_routes import router as recommendations_router
from routers.dashboard_routes import router as dashboard_router
from routers.admin_routes import router as admin_router
from routers.graph_routes import router as graph_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("researchhub")

def seed_demo_accounts():
    """Seeds admin account and updates demo accounts with proper bcrypt password hashes."""
    try:
        pw_hash = hash_password("password123")
        admin_hash = hash_password("admin123")

        # 1. Ensure admin account exists
        admin = execute_query("SELECT ResearcherID FROM Researchers WHERE Email = %s", ("admin@researchhub.test",), fetch_one=True)
        if not admin:
            execute_modify(
                """
                INSERT INTO Researchers (Name, Email, PasswordHash, Affiliation, ResearchArea, Role)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                ("System Administrator", "admin@researchhub.test", admin_hash, "ResearchHub Core Team", "System Architecture", "Admin")
            )
            logger.info("Created Admin account: admin@researchhub.test (password: admin123)")

        # 2. Update existing demo passwords if they have placeholder hashes
        execute_modify(
            "UPDATE Researchers SET PasswordHash = %s WHERE Email LIKE '%%@researchhub.test' AND (PasswordHash = 'DEMO_HASH_REPLACE_ME' OR PasswordHash = '')",
            (pw_hash,)
        )
        logger.info("Demo user credentials updated (password: password123).")
    except Exception as e:
        logger.warning("Error verifying demo accounts: %s", str(e))

async def background_citation_pulse_task():
    """Background simulator sending periodic real-time pulses across the citation graph."""
    while True:
        try:
            await asyncio.sleep(6)
            if realtime_manager.active_connections:
                citations = execute_query(
                    """
                    SELECT c.CitingPaperID, p1.Title AS CitingTitle,
                           c.CitedPaperID, p2.Title AS CitedTitle
                    FROM Citations c
                    JOIN Papers p1 ON p1.PaperID = c.CitingPaperID
                    JOIN Papers p2 ON p2.PaperID = c.CitedPaperID
                    ORDER BY RAND() LIMIT 1;
                    """,
                    fetch_one=True
                )
                if citations:
                    await realtime_manager.broadcast({
                        "type": "CITATION_PULSE",
                        "sourceId": citations["CitingPaperID"],
                        "targetId": citations["CitedPaperID"],
                        "sourceTitle": citations["CitingTitle"],
                        "targetTitle": citations["CitedTitle"],
                        "timestamp": datetime.now().isoformat(),
                        "message": f"Live Citation: '{citations['CitingTitle'][:38]}...' cited '{citations['CitedTitle'][:38]}...'"
                    })
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.debug("Pulse simulator tick: %s", str(e))

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting ResearchHub Backend API...")
    seed_demo_accounts()
    pulse_task = asyncio.create_task(background_citation_pulse_task())
    yield
    pulse_task.cancel()
    neo4j_service.close()
    logger.info("ResearchHub Backend API shutting down.")

app = FastAPI(
    title="ResearchHub API",
    description="Backend API for Research Paper Collaboration & Recommendation System (MySQL + Neo4j + Vector Search)",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(papers_router)
app.include_router(researchers_router)
app.include_router(topics_router)
app.include_router(citations_router)
app.include_router(recommendations_router)
app.include_router(dashboard_router)
app.include_router(admin_router)
app.include_router(graph_router)

class TriggerPulseRequest(BaseModel):
    sourceId: Optional[int] = None
    targetId: Optional[int] = None

@app.websocket("/ws/live")
async def websocket_live_endpoint(websocket: WebSocket):
    """Real-time bi-directional WebSocket channel for citation events and pulse streaming."""
    await realtime_manager.connect(websocket)
    try:
        # Send initial handshake message
        await websocket.send_json({
            "type": "INITIAL_STATE",
            "message": "Connected to ResearchHub Live Citation Mesh",
            "activeClients": len(realtime_manager.active_connections),
            "timestamp": datetime.now().isoformat()
        })
        while True:
            data = await websocket.receive_text()
            # Respond to client pings or client triggers
            if data == "ping":
                await websocket.send_text("pong")
            else:
                try:
                    import json
                    msg = json.loads(data)
                    if msg.get("type") == "CLIENT_PULSE":
                        await realtime_manager.broadcast({
                            "type": "CITATION_PULSE",
                            "sourceId": msg.get("sourceId"),
                            "targetId": msg.get("targetId"),
                            "sourceTitle": msg.get("sourceTitle", "Direct Citation Event"),
                            "targetTitle": msg.get("targetTitle", "Referenced Work"),
                            "timestamp": datetime.now().isoformat(),
                            "message": f"Client Pulse: {msg.get('sourceTitle', 'Paper')} -> {msg.get('targetTitle', 'Paper')}"
                        })
                except Exception:
                    pass
    except WebSocketDisconnect:
        realtime_manager.disconnect(websocket)
    except Exception as e:
        logger.debug("WebSocket error: %s", str(e))
        realtime_manager.disconnect(websocket)

@app.post("/api/realtime/pulse")
async def trigger_manual_pulse(req: TriggerPulseRequest):
    """Allows UI or external system to trigger a visible real-time citation pulse."""
    source_id = req.sourceId
    target_id = req.targetId

    if not source_id or not target_id:
        citation = execute_query(
            """
            SELECT c.CitingPaperID, p1.Title AS CitingTitle,
                   c.CitedPaperID, p2.Title AS CitedTitle
            FROM Citations c
            JOIN Papers p1 ON p1.PaperID = c.CitingPaperID
            JOIN Papers p2 ON p2.PaperID = c.CitedPaperID
            ORDER BY RAND() LIMIT 1;
            """,
            fetch_one=True
        )
        if citation:
            source_id = citation["CitingPaperID"]
            target_id = citation["CitedPaperID"]
            source_title = citation["CitingTitle"]
            target_title = citation["CitedTitle"]
        else:
            source_id, target_id = 16, 5
            source_title, target_title = "Parameter-Efficient Fine-Tuning", "Attention Is All You Need"
    else:
        p1 = execute_query("SELECT Title FROM Papers WHERE PaperID = %s", (source_id,), fetch_one=True)
        p2 = execute_query("SELECT Title FROM Papers WHERE PaperID = %s", (target_id,), fetch_one=True)
        source_title = p1["Title"] if p1 else f"Paper #{source_id}"
        target_title = p2["Title"] if p2 else f"Paper #{target_id}"

    payload = {
        "type": "CITATION_PULSE",
        "sourceId": source_id,
        "targetId": target_id,
        "sourceTitle": source_title,
        "targetTitle": target_title,
        "timestamp": datetime.now().isoformat(),
        "message": f"Manual Pulse: '{source_title[:38]}...' cited '{target_title[:38]}...'"
    }
    await realtime_manager.broadcast(payload)
    return {"status": "broadcasted", "payload": payload}

@app.get("/")
def root():
    return {
        "project": "ResearchHub - Research Paper Collaboration and Recommendation System",
        "status": "online",
        "documentation": "/docs",
        "database": "MySQL 8.0 (ResearchPaperDB)",
        "graph_db": "Neo4j Graph Database (Driver Integrated)",
        "vector_search": "TF-IDF + Cosine Semantic Recommender"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
