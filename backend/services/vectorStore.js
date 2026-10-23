/**
 * Vector Store Interface with In-Memory Caching and Cosine Similarity.
 * Supports swappable backends (e.g., Atlas Vector Search or Node In-Memory).
 */

/**
 * Computes cosine similarity between two numerical vectors of the same dimension.
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number} Score between -1.0 and 1.0 (typically 0.0 to 1.0 for embeddings)
 */
export const cosineSimilarity = (vecA, vecB) => {
    if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) {
        return 0;
    }

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

class InMemoryVectorStore {
    constructor() {
        /** @type {Map<string, { vector: number[], metadata: object }>} */
        this.store = new Map();
    }

    /**
     * Upsert a vector embedding into the store.
     * @param {string} id - Unique document identifier
     * @param {number[]} vector - Numerical embedding array
     * @param {object} [metadata={}] - Arbitrary metadata (e.g. { type: 'cv', userId: '...' })
     */
    async upsert(id, vector, metadata = {}) {
        if (!id || !Array.isArray(vector)) {
            throw new Error("Invalid id or vector supplied to vectorStore.upsert");
        }
        this.store.set(String(id), { vector, metadata });
        return true;
    }

    /**
     * Search for the top K most similar vectors to a query embedding.
     * @param {number[]} queryVector - Query embedding array
     * @param {number} [topK=10] - Number of results to return
     * @param {function} [filter=null] - Optional predicate (item) => boolean
     * @returns {Promise<Array<{ id: string, score: number, metadata: object }>>}
     */
    async search(queryVector, topK = 10, filter = null) {
        if (!queryVector || queryVector.length === 0) return [];

        const results = [];

        for (const [id, entry] of this.store.entries()) {
            if (filter && typeof filter === "function" && !filter(entry)) {
                continue;
            }

            const score = cosineSimilarity(queryVector, entry.vector);
            results.push({ id, score, metadata: entry.metadata });
        }

        results.sort((a, b) => b.score - a.score);
        return results.slice(0, topK);
    }

    /**
     * Retrieve a specific vector record.
     * @param {string} id
     */
    async get(id) {
        return this.store.get(String(id)) || null;
    }

    /**
     * Delete an embedding record by id.
     * @param {string} id
     */
    async delete(id) {
        return this.store.delete(String(id));
    }

    /**
     * Clear all vectors in memory.
     */
    async clear() {
        this.store.clear();
    }

    /**
     * Get count of stored vectors.
     */
    size() {
        return this.store.size;
    }
}

// Default exported singleton vectorStore instance
export const vectorStore = new InMemoryVectorStore();
