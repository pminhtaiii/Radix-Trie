import { useState, useCallback } from "react";
import { Api } from "./api";
import TrieVisualization from "./TrieVisualization";

export default function App() {
  const [trieData, setTrieData]       = useState(null);
  const [wordList, setWordList]       = useState([]);
  const [toast, setToast]             = useState(null);
  const [highlight, setHighlight]     = useState("");
  const [highlightType, setHighlightType] = useState("");
  const [tab, setTab]                 = useState("add");

  const [addWord, setAddWord]         = useState("");
  const [addMeaning, setAddMeaning]   = useState("");
  const [searchWord, setSearchWord]   = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [deleteWord, setDeleteWord]   = useState("");
  const [acResults, setAcResults]     = useState([]);

  // ── helpers ──────────────────────────────────────────────────
  const toast$ = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  // ── handlers ──────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addWord.trim() || !addMeaning.trim()) return;
    try {
      const res = await Api.addWord(addWord.trim(), addMeaning.trim());
      if (res.success) {
        toast$(`Added "${res.word}"`);
        setWordList(p => [...p.filter(w => w.word !== res.word), { word: res.word, meaning: res.meaning }]);
        setHighlight(res.word);
        setHighlightType("add");
        setTrieData(res.trie_snapshot);
        setAddWord(""); setAddMeaning("");
      } else {
        toast$(res.message, "warn");
      }
    } catch (err) { toast$(err.message, "error"); }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchWord.trim()) return;
    try {
      const res = await Api.searchWord(searchWord.trim());
      setSearchResult(res);
      setHighlight(res.word);
      setHighlightType("search");
      setTrieData(res.trie_snapshot);
      setAcResults([]);
    } catch {
      setSearchResult(null);
      setHighlight("");
      setHighlightType("");
      toast$(`"${searchWord.trim()}" not found`, "error");
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!deleteWord.trim()) return;
    try {
      const wordToDelete = deleteWord.trim().toLowerCase();
      const res = await Api.deleteWord(wordToDelete);
      toast$(`Deleted "${wordToDelete}"`);
      setWordList(p => p.filter(w => w.word !== wordToDelete));
      setTrieData(res.trie_snapshot);
      setHighlight(wordToDelete); 
      setHighlightType("delete"); 
      setDeleteWord("");
    } catch (err) { toast$(err.message, "error"); }
  };

  const handleClear = async () => {
    if (!window.confirm("Reset the entire dictionary?")) return;
    await Api.clearTrie();
    setTrieData(null); setWordList([]); setHighlight(""); setHighlightType("");
    toast$("Dictionary cleared");
  };

  const handleAc = async (val) => {
    setSearchWord(val);
    if (val.trim().length < 1) { setAcResults([]); return; }
    try {
      const res = await Api.autocomplete(val.trim());
      setAcResults(res.results || []);
    } catch { setAcResults([]); }
  };

  const pickAc = (word) => {
    setSearchWord(word); setAcResults([]);
  };

  const handleRefresh = async () => {
    const data = await Api.getTrie();
    setTrieData(data.trie); toast$("Trie refreshed");
  };

  // ── render ────────────────────────────────────────────────────
  return (
    <div className="app" style={{ display:"flex", flexDirection:"column", height:"100vh" }}>

      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <span className="header-dot" />
          <span className="header-title">Radix Trie</span>
          <span className="header-badge">CS523</span>
        </div>
        <div className="header-status">
          <span className="status-dot" />
          <span>API running on :8000</span>
        </div>
      </header>

      <div className="layout">

        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-top">
            {/* Tabs */}
            <div className="tabs">
              {[
                { key: "add",    label: "Add" },
                { key: "search", label: "Search" },
                { key: "delete", label: "Delete" },
              ].map(t => (
                <button key={t.key}
                  className={`tab-btn ${tab === t.key ? "active" : ""}`}
                  onClick={() => { setTab(t.key); setSearchResult(null); }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Add */}
            {tab === "add" && (
              <form className="form" onSubmit={handleAdd}>
                <div className="field">
                  <label className="field-label">Word</label>
                  <input className="input" placeholder="e.g. apple"
                    value={addWord} onChange={e => setAddWord(e.target.value)} />
                </div>
                <div className="field">
                  <label className="field-label">Definition</label>
                  <textarea className="input textarea" placeholder="Meaning of the word…"
                    value={addMeaning} onChange={e => setAddMeaning(e.target.value)} />
                </div>
                <button className="btn btn-primary" type="submit">Add word</button>
              </form>
            )}

            {/* Search */}
            {tab === "search" && (
              <form className="form" onSubmit={handleSearch}>
                <div className="field">
                  <label className="field-label">Lookup word <span style={{fontSize:10,color:"var(--t2)",marginLeft:4}}>autocomplete enabled</span></label>
                  <div className="ac-wrap">
                    <input className="input" placeholder="Start typing…"
                      value={searchWord}
                      onChange={e => handleAc(e.target.value)} />
                    {acResults.length > 0 && (
                      <ul className="ac-list">
                        {acResults.map(r => (
                          <li key={r.word} className="ac-item" onClick={() => pickAc(r.word)}>
                            <span className="ac-word">{r.word}</span>
                            <span className="ac-def">{r.meaning}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <button className="btn btn-primary" type="submit">Search</button>
                {searchResult && (
                  <div className="result-box">
                    <div className="result-word">{searchResult.word}</div>
                    <div className="result-def">{searchResult.meaning}</div>
                  </div>
                )}
              </form>
            )}

            {/* Delete */}
            {tab === "delete" && (
              <form className="form" onSubmit={handleDelete}>
                <div className="field">
                  <label className="field-label">Word to remove</label>
                  <input className="input" placeholder="e.g. apple"
                    value={deleteWord} onChange={e => setDeleteWord(e.target.value)} />
                </div>
                <button className="btn btn-danger" type="submit" style={{marginTop: 4}}>Remove word</button>
                <div className="divider" />
                <button type="button" className="btn btn-ghost" onClick={handleClear}>Reset dictionary</button>
              </form>
            )}
          </div>

          {/* Word list */}
          {wordList.length > 0 && (
            <div className="sidebar-scroll">
              <div className="divider" style={{marginTop:0}} />
              <p className="section-label" style={{marginBottom:8}}>
                Words &nbsp;<span className="count-badge">{wordList.length}</span>
              </p>
              <div className="word-chips">
                {wordList.map(w => (
                  <button key={w.word} className="chip"
                    onClick={() => { setSearchWord(w.word); setTab("search"); }}>
                    {w.word}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Refresh button at bottom */}
          <div style={{padding:"12px 20px", borderTop:"1px solid var(--border)", flexShrink:0}}>
            <button className="btn btn-ghost" onClick={handleRefresh}
              style={{fontSize:11, padding:"6px 10px", width:"auto"}}>
              ↻ &nbsp;Sync trie
            </button>
          </div>
        </aside>

        {/* Viz */}
        <main className="viz">
          {!trieData ? (
            <div className="empty">
              <span className="empty-icon">⬡</span>
              <span className="empty-title">Trie is empty</span>
              <span className="empty-sub">Add a word to visualize the structure</span>
            </div>
          ) : (
            <TrieVisualization trieData={trieData} highlightWord={highlight} highlightType={highlightType} />
          )}
        </main>
      </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
