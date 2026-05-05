from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websockets.manager import manager

router = APIRouter(tags=["websocket"])

@router.websocket("/ws/tournament/{tournament_id}")
async def websocket_endpoint(websocket: WebSocket, tournament_id: int):
    await manager.connect(websocket, tournament_id)
    try:
        while True:
            # Keep connection alive; client sends pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, tournament_id)
