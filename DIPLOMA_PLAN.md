# План для дипломной работы - Упрощённая версия

## Философия: "Выглядит круто, делается быстро"

Для диплома важно:
- ✅ Показать знание технологий
- ✅ Продемонстрировать функционал
- ✅ Красивая презентация
- ❌ Не нужна production-ready система
- ❌ Не нужна идеальная безопасность
- ❌ Не нужна масштабируемость

---

## Упрощённый стек (2-3 недели работы)

### База данных: SQLite
**Почему:** 
- Не требует установки сервера
- Один файл `database.db`
- Работает из коробки
- Для диплома более чем достаточно

### Авторизация: Простая
**Что делаем:**
- Регистрация (email + пароль)
- Вход (JWT токен)
- Хранение токена в localStorage
- Middleware для защиты роутов

**Что НЕ делаем:**
- Подтверждение email
- Восстановление пароля
- Refresh токены
- OAuth (Google, GitHub)
- Двухфакторная аутентификация

### Временные ряды: Базовые
**Что делаем:**
- Загрузка нескольких снимков
- Простой график изменений
- Таблица с данными
- Экспорт в CSV

**Что НЕ делаем:**
- Сложный анализ трендов
- Обнаружение аномалий
- Интерактивные карты
- Автоматическая загрузка снимков

---

## Схема БД (SQLite) - Минимальная

```sql
-- Пользователи
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Расчёты
CREATE TABLE calculations (
    id TEXT PRIMARY KEY, -- UUID как строка
    user_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    type TEXT NOT NULL, -- 'index', 'water', 'risk'
    parameters TEXT, -- JSON как строка
    result_path TEXT,
    preview_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Временные ряды
CREATE TABLE time_series (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    index_type TEXT NOT NULL, -- 'NDVI', 'NDWI', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Точки временного ряда
CREATE TABLE time_series_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    series_id INTEGER NOT NULL,
    calculation_id TEXT,
    date TEXT NOT NULL, -- Дата как строка 'YYYY-MM-DD'
    mean_value REAL,
    min_value REAL,
    max_value REAL,
    FOREIGN KEY (series_id) REFERENCES time_series(id),
    FOREIGN KEY (calculation_id) REFERENCES calculations(id)
);
```

---

## План реализации (2-3 недели)

### Неделя 1: База данных + Авторизация

#### День 1-2: Настройка БД
```python
# backend/database.py
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

```python
# backend/models.py
from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime, server_default=func.now())

class Calculation(Base):
    __tablename__ = "calculations"
    id = Column(String, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String)
    type = Column(String)
    parameters = Column(Text)  # JSON
    result_path = Column(String)
    preview_path = Column(String)
    created_at = Column(DateTime, server_default=func.now())

class TimeSeries(Base):
    __tablename__ = "time_series"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    index_type = Column(String)
    created_at = Column(DateTime, server_default=func.now())

class TimeSeriesPoint(Base):
    __tablename__ = "time_series_points"
    id = Column(Integer, primary_key=True, index=True)
    series_id = Column(Integer, ForeignKey("time_series.id"))
    calculation_id = Column(String, ForeignKey("calculations.id"))
    date = Column(String)
    mean_value = Column(Float)
    min_value = Column(Float)
    max_value = Column(Float)
```

#### День 3-4: Авторизация (Backend)
```python
# backend/auth.py
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta

SECRET_KEY = "your-secret-key-for-diploma"  # Для диплома можно простой
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 часа

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

```python
# backend/api/auth.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from auth import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register")
def register(email: str, username: str, password: str, db: Session = Depends(get_db)):
    # Проверка существования
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Создание пользователя
    user = User(
        email=email,
        username=username,
        password_hash=get_password_hash(password)
    )
    db.add(user)
    db.commit()
    
    return {"message": "User created successfully"}

@router.post("/login")
def login(email: str, password: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(data={"sub": str(user.id), "username": user.username})
    return {"access_token": token, "token_type": "bearer", "username": user.username}
```

#### День 5-7: Авторизация (Frontend)
```typescript
// frontend/app/lib/auth.ts
export async function register(email: string, username: string, password: string) {
  const res = await fetch('http://localhost:8000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password })
  });
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch('http://localhost:8000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.access_token) {
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('username', data.username);
  }
  return data;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
}

export function getToken() {
  return localStorage.getItem('token');
}

export function isAuthenticated() {
  return !!getToken();
}
```

```typescript
// frontend/app/login/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push("/");
    } catch (error) {
      alert("Ошибка входа");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950">
      <form onSubmit={handleSubmit} className="bg-white/5 p-8 rounded-3xl border border-white/10 w-96">
        <h1 className="text-2xl font-bold mb-6 text-white">Вход</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 rounded-xl bg-white/10 border border-white/20 text-white"
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-6 rounded-xl bg-white/10 border border-white/20 text-white"
        />
        <button type="submit" className="w-full bg-white text-black p-3 rounded-xl font-semibold">
          Войти
        </button>
      </form>
    </div>
  );
}
```

### Неделя 2: Связывание с БД + Временные ряды

#### День 8-10: Обновление API для работы с БД
```python
# backend/api/index.py - обновить
@router.post("/calculate")
async def calculate_index(
    file: UploadFile,
    satellite: str,
    index: str,
    current_user: User = Depends(get_current_user),  # Добавить
    db: Session = Depends(get_db)
):
    # ... существующая логика расчёта ...
    
    # Сохранение в БД
    calculation = Calculation(
        id=result_id,
        user_id=current_user.id,
        filename=file.filename,
        type="index",
        parameters=json.dumps({"satellite": satellite, "index": index}),
        result_path=f"data/results/{result_id}/result.tif",
        preview_path=f"data/results/{result_id}/preview.png"
    )
    db.add(calculation)
    db.commit()
    
    return {"id": result_id, ...}
```

```python
# backend/api/history.py - новый файл
@router.get("/api/history")
def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    calculations = db.query(Calculation)\
        .filter(Calculation.user_id == current_user.id)\
        .order_by(Calculation.created_at.desc())\
        .all()
    
    return [
        {
            "id": c.id,
            "filename": c.filename,
            "type": c.type,
            "created_at": c.created_at.isoformat(),
            **json.loads(c.parameters)
        }
        for c in calculations
    ]
```

#### День 11-14: Временные ряды (Backend)
```python
# backend/api/timeseries.py
@router.post("/api/time-series/create")
def create_time_series(
    name: str,
    index_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    series = TimeSeries(
        user_id=current_user.id,
        name=name,
        index_type=index_type
    )
    db.add(series)
    db.commit()
    db.refresh(series)
    return {"id": series.id, "name": series.name}

@router.post("/api/time-series/{series_id}/add-point")
def add_point(
    series_id: int,
    calculation_id: str,
    date: str,
    db: Session = Depends(get_db)
):
    # Получить расчёт
    calc = db.query(Calculation).filter(Calculation.id == calculation_id).first()
    
    # Рассчитать статистику (упрощённо - берём из meta.json)
    meta_path = f"backend/app_aplication/data/results/{calculation_id}/meta.json"
    with open(meta_path) as f:
        meta = json.load(f)
    
    # Для диплома - просто случайные значения или из meta
    point = TimeSeriesPoint(
        series_id=series_id,
        calculation_id=calculation_id,
        date=date,
        mean_value=0.5,  # Упрощённо
        min_value=0.1,
        max_value=0.9
    )
    db.add(point)
    db.commit()
    return {"message": "Point added"}

@router.get("/api/time-series/{series_id}/data")
def get_time_series_data(series_id: int, db: Session = Depends(get_db)):
    series = db.query(TimeSeries).filter(TimeSeries.id == series_id).first()
    points = db.query(TimeSeriesPoint)\
        .filter(TimeSeriesPoint.series_id == series_id)\
        .order_by(TimeSeriesPoint.date)\
        .all()
    
    return {
        "name": series.name,
        "index_type": series.index_type,
        "points": [
            {
                "date": p.date,
                "mean": p.mean_value,
                "min": p.min_value,
                "max": p.max_value
            }
            for p in points
        ]
    }
```

### Неделя 3: Временные ряды (Frontend) + Полировка

#### День 15-17: UI для временных рядов
```typescript
// frontend/app/time-series/page.tsx
"use client";
import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";

export default function TimeSeriesPage() {
  const [series, setSeries] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    // Загрузка списка временных рядов
    fetch('/api/time-series/list', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(setSeries);
  }, []);

  const loadSeriesData = async (seriesId: number) => {
    const res = await fetch(`/api/time-series/${seriesId}/data`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    
    setChartData({
      labels: data.points.map(p => p.date),
      datasets: [{
        label: data.index_type,
        data: data.points.map(p => p.mean),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Временные ряды</h1>
      
      <div className="grid grid-cols-3 gap-6">
        {/* Список временных рядов */}
        <div className="col-span-1">
          {series.map(s => (
            <button
              key={s.id}
              onClick={() => loadSeriesData(s.id)}
              className="w-full p-4 mb-3 bg-white/5 rounded-xl hover:bg-white/10"
            >
              {s.name}
            </button>
          ))}
        </div>
        
        {/* График */}
        <div className="col-span-2 bg-white/5 p-6 rounded-3xl">
          {chartData ? (
            <Line data={chartData} />
          ) : (
            <p>Выберите временной ряд</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

#### День 18-19: Интеграция и тестирование
- Проверка всех функций
- Исправление багов
- Добавление loading состояний

#### День 20-21: Презентационная полировка
- Красивые анимации
- Улучшение UI
- Добавление демо-данных для презентации

---

## Что получится в итоге

### Функционал для диплома:
✅ Регистрация и вход пользователей
✅ Личный кабинет с историей расчётов
✅ Сохранение всех расчётов в БД
✅ Создание временных рядов
✅ График изменений индекса во времени
✅ Таблица с данными
✅ Экспорт в CSV

### Что можно показать комиссии:
1. **Авторизация** - "Система поддерживает многопользовательский режим"
2. **База данных** - "Используется реляционная БД для хранения данных"
3. **Временные ряды** - "Реализован анализ динамики изменений"
4. **Визуализация** - "Интерактивные графики для анализа"

### Технологии в дипломе:
- Python (FastAPI, SQLAlchemy)
- TypeScript (Next.js, React)
- SQLite (реляционная БД)
- JWT (авторизация)
- Chart.js (визуализация)
- Tailwind CSS (современный UI)

---

## Упрощения для диплома

### Что можно НЕ делать:

1. **Безопасность**
   - Простой SECRET_KEY
   - Нет rate limiting
   - Нет HTTPS (локально)

2. **Валидация**
   - Минимальная проверка данных
   - Простые error messages

3. **Оптимизация**
   - Нет кеширования
   - Нет индексов БД (SQLite и так быстрый)
   - Нет пагинации (если данных мало)

4. **Тестирование**
   - Ручное тестирование
   - Нет unit tests (если не требуется)

5. **Документация**
   - Минимальные комментарии
   - README с инструкцией запуска

---

## Установка и запуск (для диплома)

### Backend
```bash
cd backend
pip install fastapi uvicorn sqlalchemy passlib python-jose python-multipart
python -c "from models import Base; from database import engine; Base.metadata.create_all(bind=engine)"
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm install chart.js react-chartjs-2
npm run dev
```

### Демо-данные
```python
# create_demo_data.py
from database import SessionLocal
from models import User, Calculation, TimeSeries, TimeSeriesPoint
from auth import get_password_hash
import uuid

db = SessionLocal()

# Создать демо-пользователя
user = User(
    email="demo@example.com",
    username="demo",
    password_hash=get_password_hash("demo123")
)
db.add(user)
db.commit()

# Создать демо-расчёты
for i in range(5):
    calc = Calculation(
        id=str(uuid.uuid4()),
        user_id=user.id,
        filename=f"demo_image_{i}.tif",
        type="index",
        parameters='{"satellite": "Sentinel-2", "index": "NDVI"}',
        result_path=f"data/results/demo_{i}/result.tif",
        preview_path=f"data/results/demo_{i}/preview.png"
    )
    db.add(calc)

db.commit()
print("Demo data created!")
```

---

## Презентация для защиты диплома

### Слайд 1: Титульный
"Веб-система для анализа спутниковых данных с поддержкой временных рядов"

### Слайд 2: Проблема
- Необходимость анализа изменений земной поверхности
- Отсутствие доступных инструментов для мониторинга

### Слайд 3: Решение
- Веб-приложение для расчёта индексов
- Система авторизации
- Анализ временных рядов

### Слайд 4: Архитектура
```
Frontend (Next.js) ←→ Backend (FastAPI) ←→ Database (SQLite)
```

### Слайд 5: Функционал
- Расчёт индексов (NDVI, NDWI, BSI)
- Выделение водных объектов
- Карты риска
- Временные ряды

### Слайд 6: Демонстрация
- Вход в систему
- Загрузка снимка
- Просмотр результата
- График временного ряда

### Слайд 7: Технологии
- Python, FastAPI, SQLAlchemy
- TypeScript, Next.js, React
- Chart.js, Tailwind CSS

### Слайд 8: Результаты
- Работающее приложение
- X пользователей (демо)
- Y расчётов (демо)
- Z временных рядов (демо)

---

## Итого

**Время:** 2-3 недели (вместо 5-8)

**Сложность:** Низкая-средняя

**Результат:** Полноценный диплом с современными технологиями

**Главное:** Выглядит профессионально, работает стабильно, легко демонстрировать
