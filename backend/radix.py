class RadixNode:
    def __init__(self, prefix: str):
        self.prefix = prefix
        self.children = {}
        self.is_ending = False
        self.meaning = ""
        
    def to_dict(self):
        return {
            "name": self.prefix if self.prefix else "ROOT",
            "attributes": {"Nghĩa": self.meaning} if self.is_ending else {},
            "children": [child.to_dict() for child in self.children.values()]
        }
        
class RadixTree:
    def __init__(self):
        self.root = RadixNode("")
    
    def insert(self, word: str, meaning: str):
        node = self.root
        i = 0
        while i < len(word):
            char = word[i]
            if char not in node.children:
                new_node = RadixNode(word[i:])
                new_node.is_ending = True
                new_node.meaning = meaning
                node.children[char] = new_node
                return
            child = node.children[char]
            
            j = 0
            while j < len(child.prefix) and i + j < len(word) and child.prefix[j] == word[i + j]:
                j += 1
                
            if j == len(child.prefix):
                node = child
                i += j
            else:
                split_node = RadixNode(child.prefix[j:])
                split_node.is_ending = child.is_ending
                split_node.meaning = child.meaning
                split_node.children = child.children
                
                child.prefix = child.prefix[:j]
                child.children = {split_node.prefix[0]: split_node}
                child.is_ending = False
                child.meaning = ""
                
                if i + j == len(word):
                    child.is_ending = True
                    child.meaning = meaning
                else:
                    new_leaf = RadixNode(word[i+j:])
                    new_leaf.is_ending = True
                    new_leaf.meaning = meaning
                    child.children[new_leaf.prefix[0]] = new_leaf
                    return
                
        node.is_ending = True
        node.meaning = meaning
    
    def search(self, word: str):
        node = self.root
        i = 0
        while i < len(word):
            char = word[i]
            if char not in node.children:
                return None
            
            child = node.children[char]
            j = 0
            while j < len(child.prefix) and i + j < len(word) and child.prefix[j] == word[i + j]:
                j += 1

            if j < len(child.prefix):
                return None
            
            node = child
            i += j
        
        return node.meaning if node.is_ending else None
        
    def delete(self, word: str):
        def _delete(node, current_word):
            if not current_word:
                if not node.is_ending:
                    return False
                node.is_ending = False
                node.meaning = ""
                return len(node.children) == 0
            
            char = current_word[0]
            if char not in node.children:
                return False
            
            child = node.children[char]
            prefix_len = len(child.prefix)
            
            if not current_word.startswith(child.prefix):
                return False
            
            # Recursive
            delete_child = _delete(child, current_word[prefix_len:])
            if delete_child:
                del node.children[char]
            else:
                if not child.is_ending and len(child.children) == 1:
                    child_key = list(child.children.keys())[0]
                    single_child = child.children[child_key]
                    
                    child.prefix += single_child.prefix
                    child.is_ending = single_child.is_ending
                    child.meaning = single_child.meaning
                    child.children = single_child.children
            return len(node.children) == 0 and not node.is_ending
        
        return _delete(self.root, word)

    def prefix_search(self, prefix: str) -> list[dict]:
        """Return all words that start with the given prefix."""
        node = self.root
        i = 0
        # Walk down the tree as far as the prefix takes us
        while i < len(prefix):
            char = prefix[i]
            if char not in node.children:
                return []
            child = node.children[char]
            j = 0
            while j < len(child.prefix) and i + j < len(prefix) and child.prefix[j] == prefix[i + j]:
                j += 1
            if j < len(child.prefix) and i + j == len(prefix):
                # prefix ends inside a node's label — still valid
                node = child
                i += j
                break
            if j < len(child.prefix):
                return []
            node = child
            i += j

        # Collect all words in the subtree rooted at `node`
        results: list[dict] = []
        # Rebuild the full word accumulated so far
        def _collect(n: RadixNode, current: str):
            if n.is_ending:
                results.append({"word": current, "meaning": n.meaning})
            for child in n.children.values():
                _collect(child, current + child.prefix)

        # Determine accumulated prefix up to current node
        # If we stopped mid-label, current node label only partially consumed
        # The full word prefix is the original prefix string itself
        if node.is_ending and node != self.root:
            # include node itself if it forms a complete word
            pass  # handled in _collect below
        _collect(node, prefix[:i] if i <= len(prefix) else prefix)
        return results