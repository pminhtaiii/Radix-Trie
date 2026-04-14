# Radix Trie Dictionary

An interactive English dictionary built on top of a **Radix Trie** data structure. Insert, search, delete, and autocomplete words — while watching the trie structure update in real time through a D3.js visualization.

> **CS523 — Data Structures & Algorithms**

---

## Overview

This project demonstrates the practical application of the **Radix Trie** (Patricia Trie) data structure as the backbone of a dictionary system. Unlike a naive hash map, the Radix Trie compresses shared prefixes across keys, reducing both memory usage and lookup time.

Key capabilities:

- **Insert** a word with its definition → `O(m)` where `m` = word length
- **Search** for an exact word → `O(m)`
- **Delete** a word with automatic node merging → `O(m)`
- **Prefix search / Autocomplete** — retrieve all words sharing a prefix → `O(k)` where `k` = number of results
- **Live visualization** — every mutation re-renders the trie as an animated left-to-right tree

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Data structure | Python 3.13 | Pure `RadixTree` / `RadixNode` implementation |
| Backend API | FastAPI + Uvicorn | RESTful endpoints, CORS, Pydantic schemas |
| Frontend | React 18 + Vite | Component-based UI, hot module replacement |
| Visualization | D3.js v7 | Left-right tree layout with animated transitions |
| Styling | CSS (Inter font) | Minimal dark-mode design system |

---

## Directory Structure

```
Radix - Trie/
├── backend/
│   ├── app.py                  # REST API
│   ├── radix.py                # Radix Trie
│   └── requirements.txt        # Dependencies
│
├── frontend/
│   └── src/
│       ├── App.jsx             # Main UI
│       ├── TrieVisualization.jsx  # D3.js tree
│       ├── api.js              # API wrapper
│       ├── main.jsx            # Entry point
│       └── index.css           # Styles
│
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- Python **3.13** (via [python.org](https://www.python.org/downloads/))
- Node.js **18+** and npm (via [nodejs.org](https://nodejs.org/))

---

### 1 — Clone the repository

```bash
git clone <your-repo-url>
cd "Radix - Trie"
```

---

### 2 — Set up the backend

```powershell
# Create and activate a virtual environment (Python 3.13)
py -3.13 -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Start the API server
cd backend
uvicorn app:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`.  
Swagger UI: `http://localhost:8000/docs`

---

### 3 — Set up the frontend

Open a **second terminal**:

```powershell
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## License

This project is for educational purposes (CS523 coursework).
