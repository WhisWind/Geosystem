# План на 3 дня - Экстремальная версия

## Философия: "Минимум кода, максимум эффекта"

За 3 дня реально сделать:
- ✅ SQLite БД (2 часа)
- ✅ Простейшая авторизация (4 часа)
- ✅ Связь расчётов с пользователями (3 часа)
- ✅ Базовый временной ряд с графиком (6 часов)
- ✅ UI для всего этого (6 часов)

**Итого:** ~21 час чистой работы = 3 дня по 7 часов

---

## День 1: База данных + Авторизация (Backend)

### Утро (3-4 часа): Настройка БД

#### 1. Установка зависимостей
```bash
cd backend
pip install sqlalchemy python-jose[cryptography] passlib[bcrypt]
```

#### 2. Создать `backend/database.py`
```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./geosystem.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

#### 3. Создать `backend/models.py`
```python
from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True)
    password_hash = Column(String)
    created_at = Column(DateTime, server_default=func.now())

class Calculation(Base):
    __tablename__ = "calculations"
    id = Column(String, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String)
    type = Column(String)
    parameters = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

class TimeSeries(Base):
    __tablename__ = "time_series"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    index_type = Column(String)

class TimeSeriesPoint(Base):
    __tablename__ = "time_series_points"
    id = Column(Integer, primary_key=True)
    series_id = Column(Integer, ForeignKey("time_series.id"))
    date = Column(String)
    value = Column(Float)
```

#### 4. Создать БД
```python
# backend/init_db.py
from database import engine, Base
from models import User, Calculation, TimeSeries, TimeSeriesPoint

Base.metadata.create_all(bind=engine)
print("Database created!")
```

Запустить: `python init_db.py`

### День (3-4 часа): Авторизация

#### 5. Создать `backend/auth.py`
```python
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models import User

SECRET_KEY = "diploma-secret-key-2024"
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_token(user_id: int):
    expire = datetime.utcnow() + timedelta(days=7)
    return jwt.encode({"sub": str(user_id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401)
        return user
    except:
        raise HTTPException(status_code=401, detail="Invalid token")
```

#### 6. Создать `backend/app_aplication/api/auth.py`
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from auth import hash_password, verify_password, create_token
from pydantic import BaseModel

router = APIRouter()

class RegisterRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(400, "Email exists")
    
    user = User(email=req.email, password_hash=hash_password(req.password))
    db.add(user)
    db.commit()
    return {"message": "ok"}

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")
    
    token = create_token(user.id)
    return {"token": token, "email": user.email}
```

#### 7. Обновить `backend/app_aplication/main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import router as api_router
from api.auth import router as auth_router  # Добавить

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])  # Добавить
```

---

## День 2: Frontend авторизация + Связь с БД

### Утро (3-4 часа): Frontend авторизация

#### 1. Создать `frontend/app/lib/auth.ts`
```typescript
const API_URL = 'http://localhost:8000';

export async function register(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Registration failed');
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Login failed');
  const data = await res.json();
  localStorage.setItem('token', data.token);
  localStorage.setItem('email', data.email);
  return data;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('email');
}

export function getToken() {
  return localStorage.getItem('token');
}

export function isAuthenticated() {
  return !!getToken();
}
```

#### 2. Создать `frontend/app/login/page.tsx`
```typescript
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push("/");
    } catch {
      setError("Неверный email или пароль");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950">
      <form onSubmit={handleSubmit} className="bg-white/5 p-8 rounded-3xl border border-white/10 w-96">
        <h1 className="text-2xl font-bold mb-6 text-white">Вход</h1>
        {error && <div className="mb-4 p-3 bg-red-500/20 rounded-xl text-red-300">{error}</div>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 rounded-xl bg-white/10 border border-white/20 text-white"
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-6 rounded-xl bg-white/10 border border-white/20 text-white"
          required
        />
        <button type="submit" className="w-full bg-white text-black p-3 rounded-xl font-semibold hover:bg-gray-200">
          Войти
        </button>
        <p className="mt-4 text-center text-white/60 text-sm">
          Нет аккаунта? <a href="/register" className="text-white underline">Регистрация</a>
        </p>
      </form>
    </div>
  );
}
```

#### 3. Создать `frontend/app/register/page.tsx` (копия login, но вызывает register)

#### 4. Добавить проверку авторизации в `frontend/app/page.tsx`
```typescript
// В начале компонента
useEffect(() => {
  if (!isAuthenticated()) {
    router.push('/login');
  }
}, []);
```

### День (3-4 часа): Связь расчётов с БД

#### 5. Обновить `backend/app_aplication/api/index.py`
```python
from auth import get_current_user
from models import User, Calculation
from database import get_db
import json

@router.post("/calculate")
async def calculate_index(
    file: UploadFile,
    satellite: str = Form(...),
    index: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # ... существующая логика расчёта ...
    
    # Сохранить в БД
    calc = Calculation(
        id=result_id,
        user_id=current_user.id,
        filename=file.filename,
        type="index",
        parameters=json.dumps({"satellite": satellite, "index": index})
    )
    db.add(calc)
    db.commit()
    
    return {"id": result_id, "message": "Success"}
```

#### 6. Создать `backend/app_aplication/api/history.py`
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User, Calculation
from auth import get_current_user
import json

router = APIRouter()

@router.get("/history")
def get_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    calcs = db.query(Calculation).filter(Calculation.user_id == current_user.id).order_by(Calculation.created_at.desc()).all()
    return [
        {
            "id": c.id,
            "filename": c.filename,
            "type": c.type,
            "created_at": c.created_at.isoformat(),
            **json.loads(c.parameters)
        }
        for c in calcs
    ]
```

Добавить в main.py: `app.include_router(history_router, prefix="/api")`

#### 7. Обновить `frontend/app/lib/api.ts`
```typescript
// Добавить токен ко всем запросам
export async function calculateIndex(formData: FormData) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/index/calculate`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  return res.json();
}

export async function getHistory() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/history`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}
```

---

## День 3: Временные ряды

### Утро (3 часа): Backend временных рядов

#### 1. Создать `backend/app_aplication/api/timeseries.py`
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User, TimeSeries, TimeSeriesPoint
from auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class CreateSeriesRequest(BaseModel):
    name: str
    index_type: str

class AddPointRequest(BaseModel):
    date: str
    value: float

@router.post("/create")
def create_series(req: CreateSeriesRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    series = TimeSeries(user_id=current_user.id, name=req.name, index_type=req.index_type)
    db.add(series)
    db.commit()
    db.refresh(series)
    return {"id": series.id}

@router.get("/list")
def list_series(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    series = db.query(TimeSeries).filter(TimeSeries.user_id == current_user.id).all()
    return [{"id": s.id, "name": s.name, "index_type": s.index_type} for s in series]

@router.post("/{series_id}/add-point")
def add_point(series_id: int, req: AddPointRequest, db: Session = Depends(get_db)):
    point = TimeSeriesPoint(series_id=series_id, date=req.date, value=req.value)
    db.add(point)
    db.commit()
    return {"message": "ok"}

@router.get("/{series_id}/data")
def get_series_data(series_id: int, db: Session = Depends(get_db)):
    series = db.query(TimeSeries).filter(TimeSeries.id == series_id).first()
    points = db.query(TimeSeriesPoint).filter(TimeSeriesPoint.series_id == series_id).order_by(TimeSeriesPoint.date).all()
    return {
        "name": series.name,
        "index_type": series.index_type,
        "points": [{"date": p.date, "value": p.value} for p in points]
    }
```

Добавить в main.py: `app.include_router(timeseries_router, prefix="/api/time-series")`

### День (3 часа): Frontend временных рядов

#### 2. Установить Chart.js
```bash
cd frontend
npm install chart.js react-chartjs-2
```

#### 3. Создать `frontend/app/time-series/page.tsx`
```typescript
"use client";
import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const API_URL = 'http://localhost:8000';

export default function TimeSeriesPage() {
  const [series, setSeries] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIndex, setNewIndex] = useState("NDVI");

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/time-series/list`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setSeries(data);
  };

  const createSeries = async () => {
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/api/time-series/create`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, index_type: newIndex })
    });
    setShowCreate(false);
    loadSeries();
  };

  const loadData = async (id: number) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/time-series/${id}/data`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    
    setChartData({
      labels: data.points.map(p => p.date),
      datasets: [{
        label: data.index_type,
        data: data.points.map(p => p.value),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      }]
    });
    setSelectedId(id);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Временные ряды</h1>
          <button onClick={() => setShowCreate(true)} className="bg-white text-black px-6 py-3 rounded-xl font-semibold">
            Создать
          </button>
        </div>

        {showCreate && (
          <div className="mb-8 bg-white/5 p-6 rounded-3xl border border-white/10">
            <h2 className="text-xl font-bold mb-4">Новый временной ряд</h2>
            <input
              type="text"
              placeholder="Название"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-3 mb-4 rounded-xl bg-white/10 border border-white/20 text-white"
            />
            <select
              value={newIndex}
              onChange={(e) => setNewIndex(e.target.value)}
              className="w-full p-3 mb-4 rounded-xl bg-white/10 border border-white/20 text-white"
            >
              <option value="NDVI">NDVI</option>
              <option value="NDWI">NDWI</option>
              <option value="BSI">BSI</option>
            </select>
            <button onClick={createSeries} className="bg-white text-black px-6 py-3 rounded-xl font-semibold">
              Создать
            </button>
          </div>
        )}

        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-1 space-y-3">
            {series.map(s => (
              <button
                key={s.id}
                onClick={() => loadData(s.id)}
                className={`w-full p-4 rounded-xl text-left transition ${
                  selectedId === s.id ? 'bg-white/10' : 'bg-white/5 hover:bg-white/8'
                }`}
              >
                <div className="font-semibold">{s.name}</div>
                <div className="text-sm text-white/60">{s.index_type}</div>
              </button>
            ))}
          </div>

          <div className="col-span-3 bg-white/5 p-6 rounded-3xl border border-white/10">
            {chartData ? (
              <Line data={chartData} options={{ responsive: true, maintainAspectRatio: true }} />
            ) : (
              <div className="text-center py-20 text-white/50">Выберите временной ряд</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### 4. Добавить ссылку в навигацию `frontend/app/page.tsx`
```typescript
<a href="/time-series" className="text-white/80 hover:text-white">Временные ряды</a>
```

---

## Демо-данные для презентации

Создать `backend/demo_data.py`:
```python
from database import SessionLocal
from models import User, TimeSeries, TimeSeriesPoint
from auth import hash_password

db = SessionLocal()

# Создать демо-пользователя
user = User(email="demo@demo.com", password_hash=hash_password("demo"))
db.add(user)
db.commit()

# Создать временной ряд
series = TimeSeries(user_id=user.id, name="Мониторинг озера", index_type="NDVI")
db.add(series)
db.commit()

# Добавить точки
dates = ["2024-01-15", "2024-02-15", "2024-03-15", "2024-04-15"]
values = [0.45, 0.52, 0.61, 0.58]

for date, value in zip(dates, values):
    point = TimeSeriesPoint(series_id=series.id, date=date, value=value)
    db.add(point)

db.commit()
print("Demo data created! Login: demo@demo.com / demo")
```

Запустить: `python demo_data.py`

---

## Чеклист на 3 дня

### День 1
- [ ] Установить зависимости
- [ ] Создать database.py, models.py
- [ ] Создать БД (init_db.py)
- [ ] Создать auth.py
- [ ] Создать api/auth.py
- [ ] Обновить main.py
- [ ] Протестировать регистрацию/вход через Postman

### День 2
- [ ] Создать lib/auth.ts
- [ ] Создать login/page.tsx
- [ ] Создать register/page.tsx
- [ ] Добавить проверку авторизации
- [ ] Обновить api/index.py (добавить user_id)
- [ ] Создать api/history.py
- [ ] Обновить lib/api.ts (добавить токены)
- [ ] Протестировать расчёт с авторизацией

### День 3
- [ ] Создать api/timeseries.py
- [ ] Установить Chart.js
- [ ] Создать time-series/page.tsx
- [ ] Добавить навигацию
- [ ] Создать demo_data.py
- [ ] Запустить демо-данные
- [ ] Протестировать всё вместе

---

## Что получится за 3 дня

✅ Авторизация (регистрация + вход)
✅ Сохранение расчётов в БД
✅ История расчётов пользователя
✅ Создание временных рядов
✅ График изменений
✅ Демо-данные для презентации

**Этого достаточно для диплома!**

---

## Запуск для презентации

```bash
# Terminal 1 - Backend
cd backend
python demo_data.py
uvicorn app_aplication.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Открыть http://localhost:3000
Войти: demo@demo.com / demo

---

## Что говорить комиссии

"Разработана веб-система для анализа спутниковых данных с поддержкой:
- Многопользовательского режима (авторизация)
- Реляционной базы данных (SQLite)
- Анализа временных рядов с визуализацией
- Современного стека технологий (FastAPI, Next.js, TypeScript)"

**Звучит солидно, делается за 3 дня!**
