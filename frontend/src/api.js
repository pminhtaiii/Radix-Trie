const BASE = "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

export const Api = {
  addWord: (word, meaning) =>
    request("/words", { method: "POST", body: JSON.stringify({ word, meaning }) }),

  updateWord: (word, meaning) =>
    request("/words", { method: "PUT", body: JSON.stringify({ word, meaning }) }),

  searchWord: (word) =>
    request(`/words/${encodeURIComponent(word)}`),

  deleteWord: (word) =>
    request(`/words/${encodeURIComponent(word)}`, { method: "DELETE" }),

  getTrie: () =>
    request("/trie"),

  clearTrie: () =>
    request("/trie", { method: "DELETE" }),

  autocomplete: (prefix) =>
    request(`/words/prefix/${encodeURIComponent(prefix)}`),
};
