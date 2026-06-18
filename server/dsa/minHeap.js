/*
  MIN-HEAP EXPLAINED
  ──────────────────
  A heap is a complete binary tree stored as an array.
  In a MIN-HEAP: parent is always ≤ its children.
  → Root is always the minimum element → O(1) to peek best driver.

  WHY HEAP INSTEAD OF SORT?
  ──────────────────────────
  Array.sort()  → O(n log n) — sorts everything even if you only want top 3
  Min-Heap      → O(log n) insert, O(log n) extract → better for streaming data

  PARENT / CHILD index formulas (0-based):
    parent(i)      = Math.floor((i - 1) / 2)
    leftChild(i)   = 2 * i + 1
    rightChild(i)  = 2 * i + 2
*/
class MinHeap {
  constructor(compareFn = (a, b) => a - b) {
    this.heap      = [];
    this.compareFn = compareFn;
  }

  size()    { return this.heap.length; }
  isEmpty() { return this.heap.length === 0; }
  peek()    { return this.heap[0] ?? null; }

  // O(log n) — add element and bubble up to correct position
  insert(val) {
    this.heap.push(val);
    this._bubbleUp(this.heap.length - 1);
  }

  // O(log n) — remove + return minimum, sink new root down
  extractMin() {
    if (this.isEmpty()) return null;
    const min  = this.heap[0];
    const last = this.heap.pop();
    if (!this.isEmpty()) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return min;
  }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.compareFn(this.heap[i], this.heap[parent]) >= 0) break;
      [this.heap[i], this.heap[parent]] = [this.heap[parent], this.heap[i]];
      i = parent;
    }
  }

  _sinkDown(i) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this.compareFn(this.heap[l], this.heap[smallest]) < 0) smallest = l;
      if (r < n && this.compareFn(this.heap[r], this.heap[smallest]) < 0) smallest = r;
      if (smallest === i) break;
      [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
      i = smallest;
    }
  }
}

export default MinHeap;