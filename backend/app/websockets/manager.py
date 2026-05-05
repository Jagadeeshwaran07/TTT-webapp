from typing import Dict, List
from fastapi import WebSocket
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, tournament_id: int):
        await websocket.accept()
        if tournament_id not in self.active_connections:
            self.active_connections[tournament_id] = []
        self.active_connections[tournament_id].append(websocket)

    def disconnect(self, websocket: WebSocket, tournament_id: int):
        if tournament_id in self.active_connections:
            self.active_connections[tournament_id].discard(websocket) if hasattr(
                self.active_connections[tournament_id], 'discard'
            ) else None
            try:
                self.active_connections[tournament_id].remove(websocket)
            except ValueError:
                pass

    async def broadcast(self, tournament_id: int, data: dict):
        connections = self.active_connections.get(tournament_id, [])
        dead = []
        for ws in connections:
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, tournament_id)

manager = ConnectionManager()
