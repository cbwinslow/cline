import fs from 'fs/promises';
import path from 'path';
import { fileExistsAtPath } from '../../utils/fs';

export interface Memory {
	id: string;
	content: string;
	timestamp: number;
	tags: string[];
	relevance?: number;
}

/**
 * Manages persistent memories for Cline
 * Memories help Cline remember context across sessions
 */
export class MemoryManager {
	private storageDir: string;
	private memories: Map<string, Memory> = new Map();
	private maxMemories: number;

	constructor(storageDir: string, maxMemories: number = 100) {
		this.storageDir = storageDir;
		this.maxMemories = maxMemories;
	}

	/**
	 * Load memories from disk
	 */
	async load(): Promise<void> {
		const memoriesFile = path.join(this.storageDir, 'memories.json');
		
		if (await fileExistsAtPath(memoriesFile)) {
			const data = await fs.readFile(memoriesFile, 'utf-8');
			const memoriesArray: Memory[] = JSON.parse(data);
			
			for (const memory of memoriesArray) {
				this.memories.set(memory.id, memory);
			}
		}
	}

	/**
	 * Save memories to disk
	 */
	async save(): Promise<void> {
		await fs.mkdir(this.storageDir, { recursive: true });
		
		const memoriesArray = Array.from(this.memories.values());
		const memoriesFile = path.join(this.storageDir, 'memories.json');
		
		await fs.writeFile(
			memoriesFile,
			JSON.stringify(memoriesArray, null, 2),
			'utf-8'
		);
	}

	/**
	 * Add a new memory
	 */
	async addMemory(content: string, tags: string[] = []): Promise<Memory> {
		const memory: Memory = {
			id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
			content,
			timestamp: Date.now(),
			tags,
		};

		this.memories.set(memory.id, memory);

		// Enforce max memories limit
		if (this.memories.size > this.maxMemories) {
			// Remove oldest memory
			const oldestId = Array.from(this.memories.entries())
				.sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
			this.memories.delete(oldestId);
		}

		await this.save();
		return memory;
	}

	/**
	 * Get a specific memory by ID
	 */
	getMemory(id: string): Memory | undefined {
		return this.memories.get(id);
	}

	/**
	 * Get all memories
	 */
	getAllMemories(): Memory[] {
		return Array.from(this.memories.values())
			.sort((a, b) => b.timestamp - a.timestamp);
	}

	/**
	 * Search memories by tags
	 */
	getMemoriesByTags(tags: string[]): Memory[] {
		return Array.from(this.memories.values())
			.filter(memory => 
				tags.some(tag => memory.tags.includes(tag))
			)
			.sort((a, b) => b.timestamp - a.timestamp);
	}

	/**
	 * Get relevant memories for a given context
	 */
	async getRelevantMemories(context: string, limit: number = 5): Promise<string[]> {
		// Simple relevance scoring based on keyword matching
		// In a production system, this could use embeddings and vector search
		const contextWords = context.toLowerCase().split(/\s+/);
		
		const scoredMemories = Array.from(this.memories.values()).map(memory => {
			const memoryWords = memory.content.toLowerCase().split(/\s+/);
			const score = contextWords.reduce((acc, word) => {
				return acc + (memoryWords.includes(word) ? 1 : 0);
			}, 0);
			
			return { memory, score };
		});

		return scoredMemories
			.sort((a, b) => b.score - a.score)
			.slice(0, limit)
			.filter(item => item.score > 0)
			.map(item => item.memory.content);
	}

	/**
	 * Delete a memory
	 */
	async deleteMemory(id: string): Promise<boolean> {
		const deleted = this.memories.delete(id);
		if (deleted) {
			await this.save();
		}
		return deleted;
	}

	/**
	 * Clear all memories
	 */
	async clearAll(): Promise<void> {
		this.memories.clear();
		await this.save();
	}

	/**
	 * Get memory statistics
	 */
	getStats(): { count: number; maxMemories: number; storageDir: string } {
		return {
			count: this.memories.size,
			maxMemories: this.maxMemories,
			storageDir: this.storageDir,
		};
	}
}
