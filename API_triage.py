# Librerias para consumir el modelo .joblib
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Literal

# Cargar el modelo
model = joblib.load('model_artifact\\news_rf_pipeline.joblib')

# Inicializa FastAPI
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NEWSInput(BaseModel):
    Sex: Literal[1, 2] = Field(..., description="1 = Mujer, 2 = Hombre")
    Age: int = Field(..., ge=0, le=120)
    Mental: int = Field(..., ge=0, le=4, description="AVPU codificado 0‑4")
    NRS_pain: int = Field(..., ge=0, le=10)
    SBP: int = Field(..., ge=50, le=300)
    DBP: int = Field(..., ge=30, le=200)
    HR: int = Field(..., ge=20, le=250)
    RR: int = Field(..., ge=5, le=60)
    BT: float = Field(..., ge=30, le=45, description="°C")
    Saturation: int = Field(..., ge=50, le=100)

    class Config:
        schema_extra = {
            "example": {
                "Sex": 1,
                "Age": 68,
                "Mental": 0,
                "NRS_pain": 2,
                "SBP": 98,
                "DBP": 62,
                "HR": 110,
                "RR": 22,
                "BT": 38.1,
                "Saturation": 92
            }
        }


FEATURE_ORDER: List[str] = [
    "Sex",
    "Age",
    "Mental",
    "NRS_pain",
    "SBP",
    "DBP",
    "HR",
    "RR",
    "BT",
    "Saturation",
]

LEVELS = [1, 2, 3, 4, 5]  # Clases de salida ordenadas


def make_dataframe(data: NEWSInput) -> pd.DataFrame:
    """Convierte la entrada Pydantic en un DataFrame con el orden correcto."""
    df = pd.DataFrame([[getattr(data, f) for f in FEATURE_ORDER]], columns=FEATURE_ORDER)
    return df


# ---------------------------------------------------------------------------
# 5. Endpoints
# ---------------------------------------------------------------------------
@app.get("/", tags=["health"])
async def root():
    """Health‑check básico."""
    return {"status": "ok"}


@app.post("/predict", tags=["inference"])
async def predict(payload: NEWSInput):
    """Devuelve la clase KTAS (1‑5) y las probabilidades."""
    try:
        X = make_dataframe(payload)
        prob_vec = model.predict_proba(X)[0]  # → ndarray shape (5,)
        pred_class = int(model.predict(X)[0])  # 1–5 ya que entrenaste con esas etiquetas

        # Mapear probabilidades a nombres de clase para claridad
        prob_dict = {str(cls): float(prob_vec[idx]) for idx, cls in enumerate(LEVELS)}

        return {"prediction": pred_class}
    except Exception as exc:  # pylint: disable=broad-except
        raise HTTPException(status_code=500, detail=str(exc)) from exc
