/*
  DIJKSTRA'S SHORTEST PATH ALGORITHM
  ════════════════════════════════════

  WHY DIJKSTRA FOR ROUTING?
  ─────────────────────────
  Given a city graph where nodes = intersections and
  edges = roads with weights (distance in km), Dijkstra
  finds the shortest path between two points.

  Time complexity:  O((V + E) log V)  with a min-heap
  Space complexity: O(V)

  HOW IT WORKS (step by step):
  1. Set distance to start = 0, all others = Infinity
  2. Push start into min-heap: [cost=0, node=start]
  3. Extract min-cost node from heap
  4. For each neighbour: if current cost + edge < known dist → update + push to heap
  5. Repeat until heap empty or destination reached
  6. Walk prev[] backwards to reconstruct the path

  WHY MIN-HEAP INSTEAD OF ARRAY?
  ─────────────────────────────────
  Array.find(min) = O(V) per step → total O(V²)
  Min-heap extract = O(log V)     → total O((V+E) log V)
  For large city graphs (10,000+ nodes) the difference is massive.
*/

import MinHeap from './minHeap.js';

/**
 * @param {Object} graph  - adjacency list { node: [[neighbour, weight], ...] }
 * @param {string} start  - starting node key
 * @param {string} end    - destination node key
 * @returns {{ distance: number, path: string[] } | null}
 */
const dijkstra = (graph, start, end) => {

  // Edge case — same node
  if (start === end) return { distance: 0, path: [start] };

  // Edge case — node doesn't exist in graph
  if (!graph[start] || !graph[end]) return null;

  // dist[node] = shortest known distance from start to node
  const dist = {};

  // prev[node] = which node we came from on the shortest path
  const prev = {};

  // visited = don't reprocess nodes we've already settled
  const visited = new Set();

  // Min-heap ordered by cost: [cost, nodeKey]
  const heap = new MinHeap((a, b) => a[0] - b[0]);

  // Initialise all distances to Infinity
  for (const node of Object.keys(graph)) {
    dist[node] = Infinity;
    prev[node] = null;
  }

  // Start node costs 0
  dist[start] = 0;
  heap.insert([0, start]);

  while (!heap.isEmpty()) {
    const [cost, node] = heap.extractMin();

    // Skip if already settled (stale heap entry)
    if (visited.has(node)) continue;
    visited.add(node);

    // Early exit — reached destination
    if (node === end) break;

    // Relax all edges from this node
    for (const [neighbour, weight] of (graph[node] || [])) {
      if (visited.has(neighbour)) continue;

      const newCost = dist[node] + weight;

      if (newCost < dist[neighbour]) {
        dist[neighbour] = newCost;
        prev[neighbour] = node;
        heap.insert([newCost, neighbour]);
      }
    }
  }

  // No path found
  if (dist[end] === Infinity) return null;

  // Reconstruct path by walking prev[] backwards from end → start
  const path = [];
  let current = end;
  while (current !== null) {
    path.unshift(current);       // prepend to get start→end order
    current = prev[current];
  }

  return {
    distance: parseFloat(dist[end].toFixed(2)),
    path,
  };
};

export default dijkstra;