/*
  LRU CACHE — Least Recently Used
  ════════════════════════════════

  WHY LRU FOR ROUTE CACHING?
  ──────────────────────────
  Dijkstra runs in O((V+E) log V) — expensive for every request.
  Popular routes (airport → station, home → office) get requested
  constantly. Cache them so Dijkstra only runs ONCE per unique route.

  LRU evicts the route that hasn't been used the longest when full.
  This keeps hot routes (frequently used) in cache automatically.

  DATA STRUCTURE: HashMap + Doubly Linked List
  ─────────────────────────────────────────────
  HashMap  → O(1) lookup by key
  DLL      → O(1) move-to-front and evict-from-back

  HEAD (most recent) ←→ node ←→ node ←→ TAIL (least recent)

  get(key):
    1. HashMap lookup → O(1)
    2. Move node to front → O(1)
    3. Return value

  set(key, val):
    1. If exists → update + move to front
    2. If new + full → evict tail, add to front
    3. If new + not full → add to front

  Both operations: O(1) time, O(capacity) space
*/

class DLLNode {
  constructor(key, val) {
    this.key  = key;
    this.val  = val;
    this.prev = null;
    this.next = null;
  }
}

class LRUCache {
  constructor(capacity = 100) {
    this.capacity = capacity;
    this.size     = 0;
    this.map      = new Map();   // key → DLLNode

    // Sentinel nodes — avoid null checks on every operation
    // HEAD.next = most recently used
    // TAIL.prev = least recently used (evict this one)
    this.head = new DLLNode('HEAD', null);
    this.tail = new DLLNode('TAIL', null);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  // O(1) — get value and mark as most recently used
  get(key) {
    if (!this.map.has(key)) return null;
    const node = this.map.get(key);
    this._moveToFront(node);
    return node.val;
  }

  // O(1) — insert or update, evict LRU if over capacity
  set(key, val) {
    if (this.map.has(key)) {
      // Update existing node
      const node = this.map.get(key);
      node.val   = val;
      this._moveToFront(node);
    } else {
      // Create new node
      const node = new DLLNode(key, val);
      this.map.set(key, node);
      this._addToFront(node);
      this.size++;

      // Evict least recently used if over capacity
      if (this.size > this.capacity) {
        const lru = this.tail.prev;   // node just before tail sentinel
        this._removeNode(lru);
        this.map.delete(lru.key);
        this.size--;
      }
    }
  }

  // Check if key exists without updating recency
  has(key) {
    return this.map.has(key);
  }

  // Current number of cached entries
  getSize() {
    return this.size;
  }

  // ── Private helpers ──────────────────────────────────────────────

  _addToFront(node) {
    // Insert between head sentinel and current first node
    node.prev           = this.head;
    node.next           = this.head.next;
    this.head.next.prev = node;
    this.head.next      = node;
  }

  _removeNode(node) {
    // Unlink node from its current position
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  _moveToFront(node) {
    this._removeNode(node);
    this._addToFront(node);
  }
}

export default LRUCache;