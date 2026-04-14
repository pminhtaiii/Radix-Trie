from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from radix import RadixTree

# ──────────────────────────────────────────────
# App setup
# ──────────────────────────────────────────────
app = FastAPI(
    title="English Dictionary – Radix Trie",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────
# Shared state – one RadixTree instance per process
# ──────────────────────────────────────────────
dictionary: RadixTree = RadixTree()

# ──────────────────────────────────────────────
# Request / Response schemas
# ──────────────────────────────────────────────
class WordEntry(BaseModel):
    word: str
    meaning: str

class WordQuery(BaseModel):
    word: str

class OperationResponse(BaseModel):
    success: bool
    message: str
    word: Optional[str] = None
    meaning: Optional[str] = None
    trie_snapshot: dict  

# ──────────────────────────────────────────────
# Helper
# ──────────────────────────────────────────────
def _snapshot() -> dict:
    """Return the current Radix-Trie structure as a dict."""
    return dictionary.root.to_dict()

# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    """Health-check endpoint."""
    return {"status": "ok", "message": "English Dictionary API is running."}


@app.post("/words", response_model=OperationResponse, tags=["Dictionary"])
def add_word(entry: WordEntry):
    """
    **Thêm một mục từ** vào từ điển.

    - `word`: từ tiếng Anh cần thêm (không phân biệt hoa/thường – lưu dạng thường)
    - `meaning`: nghĩa / định nghĩa của từ

    Trả về thông báo kết quả và ảnh chụp cấu trúc Radix-Trie **sau khi thêm**.
    """
    word = entry.word.strip().lower()
    meaning = entry.meaning.strip()

    if not word:
        raise HTTPException(status_code=422, detail="'word' không được để trống.")
    if not meaning:
        raise HTTPException(status_code=422, detail="'meaning' không được để trống.")

    # Check for duplicate
    existing = dictionary.search(word)
    if existing is not None:
        return OperationResponse(
            success=False,
            message=f"Từ '{word}' đã tồn tại trong từ điển. Dùng PUT /words để cập nhật.",
            word=word,
            meaning=existing,
            trie_snapshot=_snapshot(),
        )

    dictionary.insert(word, meaning)

    return OperationResponse(
        success=True,
        message=f"Đã thêm từ '{word}' vào từ điển.",
        word=word,
        meaning=meaning,
        trie_snapshot=_snapshot(),
    )


@app.put("/words", response_model=OperationResponse, tags=["Dictionary"])
def update_word(entry: WordEntry):
    """
    **Cập nhật nghĩa** của một từ đã có trong từ điển.

    Nếu từ chưa tồn tại, tự động thêm mới.
    Trả về thông báo kết quả và ảnh chụp cấu trúc Radix-Trie **sau khi cập nhật**.
    """
    word = entry.word.strip().lower()
    meaning = entry.meaning.strip()

    if not word:
        raise HTTPException(status_code=422, detail="'word' không được để trống.")
    if not meaning:
        raise HTTPException(status_code=422, detail="'meaning' không được để trống.")

    existing = dictionary.search(word)
    if existing is not None:
        # Delete old entry then re-insert with new meaning
        dictionary.delete(word)
        dictionary.insert(word, meaning)
        msg = f"Đã cập nhật nghĩa của từ '{word}'."
    else:
        dictionary.insert(word, meaning)
        msg = f"Từ '{word}' chưa tồn tại – đã thêm mới vào từ điển."

    return OperationResponse(
        success=True,
        message=msg,
        word=word,
        meaning=meaning,
        trie_snapshot=_snapshot(),
    )


@app.delete("/words/{word}", response_model=OperationResponse, tags=["Dictionary"])
def delete_word(word: str):
    """
    **Xoá một mục từ** khỏi từ điển.

    - `word`: từ cần xoá (trong URL path, không phân biệt hoa/thường)

    Trả về thông báo kết quả và ảnh chụp cấu trúc Radix-Trie **sau khi xoá**.
    """
    word = word.strip().lower()

    if not word:
        raise HTTPException(status_code=422, detail="'word' không được để trống.")

    existing = dictionary.search(word)
    if existing is None:
        raise HTTPException(
            status_code=404,
            detail=f"Từ '{word}' không tồn tại trong từ điển."
        )

    dictionary.delete(word)

    return OperationResponse(
        success=True,
        message=f"Đã xoá từ '{word}' khỏi từ điển.",
        word=word,
        meaning=None,
        trie_snapshot=_snapshot(),
    )


@app.get("/words/{word}", response_model=OperationResponse, tags=["Dictionary"])
def search_word(word: str):
    """
    **Tìm nghĩa của từ** trong từ điển.

    - `word`: từ cần tra cứu (trong URL path, không phân biệt hoa/thường)

    Trả về nghĩa của từ (nếu tìm thấy) và ảnh chụp cấu trúc Radix-Trie **hiện tại**
    (không có thay đổi dữ liệu với thao tác này).
    """
    word = word.strip().lower()

    if not word:
        raise HTTPException(status_code=422, detail="'word' không được để trống.")

    meaning = dictionary.search(word)

    if meaning is None:
        raise HTTPException(
            status_code=404,
            detail=f"Từ '{word}' không tồn tại trong từ điển."
        )

    return OperationResponse(
        success=True,
        message=f"Tìm thấy từ '{word}'.",
        word=word,
        meaning=meaning,
        trie_snapshot=_snapshot(),
    )


@app.get("/trie", tags=["Dictionary"])
def get_trie():
    """
    Trả về **toàn bộ cấu trúc Radix-Trie** hiện tại dưới dạng JSON nested tree.

    Hữu ích để visualize cây sau mỗi thao tác.
    """
    return {
        "trie": _snapshot(),
        "message": "Cấu trúc Radix-Trie hiện tại.",
    }


@app.get("/words/prefix/{prefix}", tags=["Dictionary"])
def autocomplete(prefix: str):
    """
    **Autocomplete** – trả về tất cả từ bắt đầu bằng `prefix`.
    """
    prefix = prefix.strip().lower()
    if not prefix:
        raise HTTPException(status_code=422, detail="'prefix' không được để trống.")
    results = dictionary.prefix_search(prefix)
    return {
        "prefix": prefix,
        "count": len(results),
        "results": results,
    }


@app.delete("/trie", tags=["Dictionary"])
def clear_trie():
    """
    **Xoá toàn bộ từ điển** (reset Radix-Trie về trạng thái rỗng).
    """
    global dictionary
    dictionary = RadixTree()
    return {
        "success": True,
        "message": "Đã xoá toàn bộ từ điển.",
        "trie_snapshot": _snapshot(),
    }
