from fastapi import FastAPI, WebSocket, HTTPException, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
import asyncio
import logging
from services.marl import DriveGraphEnv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Simulation API")

# Add CORS middleware to allow frontend to access API endpoints
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/health")
def health():
    return {"status": "ok"}

# exmpale code for a websocket endpoint
@app.websocket("/ws/engine")
async def websocket_endpoint_engine(websocket: WebSocket):
    await websocket.accept()
    env = None
    simulation_task = None
    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("type")

            if event_type == "start":
                simulation_task = asyncio.create_task(run_simulation(websocket))

            elif event_type == "stop":
                if simulation_task:
                    simulation_task.cancel()
                    simulation_task = None
                await websocket.send_json({"type": "info", "message": "Simulation stopped"})

    except WebSocketDisconnect:
        logger.info("Client disconnected from engine websocket")
        if simulation_task:
            simulation_task.cancel()
    except Exception as e:
        logger.error(f"Error in engine websocket: {e}", exc_info=True)
        # The connection might be closed already, so this might fail
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception as send_error:
            logger.error(f"Could not send error to client: {send_error}")


async def run_simulation(websocket: WebSocket):
    """Coroutine to run the simulation and send updates."""
    try:
        while True:
            # TODO: implement simulation
            await websocket.send_json({
                "type": "update",
                "message": "Simulation running"
            })
            await asyncio.sleep(0.05) # 20 updates per second
    except asyncio.CancelledError:
        logger.info("Simulation task was cancelled.")
    except Exception as e:
        logger.error(f"Error during simulation: {e}", exc_info=True)
        try:
            await websocket.send_json({"type": "error", "message": f"Simulation failed: {e}"})
        except Exception as send_error:
            logger.error(f"Could not send simulation error to client: {send_error}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
