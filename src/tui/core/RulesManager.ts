import fs from 'fs/promises';
import path from 'path';
import { fileExistsAtPath } from '../../utils/fs';

export interface Rule {
	id: string;
	name: string;
	description: string;
	content: string;
	enabled: boolean;
	priority: number;
	tags: string[];
}

/**
 * Manages rules for Cline
 * Rules provide guidelines and constraints for Cline's behavior
 */
export class RulesManager {
	private rulesDir: string;
	private rules: Map<string, Rule> = new Map();

	constructor(rulesDir: string) {
		this.rulesDir = rulesDir;
	}

	/**
	 * Load rules from disk
	 */
	async load(): Promise<void> {
		await fs.mkdir(this.rulesDir, { recursive: true });

		const rulesFile = path.join(this.rulesDir, 'rules.json');
		
		if (await fileExistsAtPath(rulesFile)) {
			const data = await fs.readFile(rulesFile, 'utf-8');
			const rulesArray: Rule[] = JSON.parse(data);
			
			for (const rule of rulesArray) {
				this.rules.set(rule.id, rule);
			}
		} else {
			// Create default rules
			await this.createDefaultRules();
		}
	}

	/**
	 * Create default rules
	 */
	private async createDefaultRules(): Promise<void> {
		const defaultRules: Omit<Rule, 'id'>[] = [
			{
				name: 'Code Quality',
				description: 'Ensure code follows best practices',
				content: 'Always write clean, maintainable code. Follow language-specific best practices and conventions.',
				enabled: true,
				priority: 1,
				tags: ['code', 'quality'],
			},
			{
				name: 'Security',
				description: 'Prioritize security in all code changes',
				content: 'Never commit secrets or sensitive data. Always validate user input. Follow security best practices.',
				enabled: true,
				priority: 1,
				tags: ['security'],
			},
			{
				name: 'Testing',
				description: 'Include tests for new functionality',
				content: 'When adding new features, include appropriate tests. Update existing tests when modifying code.',
				enabled: true,
				priority: 2,
				tags: ['testing', 'quality'],
			},
		];

		for (const ruleData of defaultRules) {
			const rule: Rule = {
				...ruleData,
				id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
			};
			this.rules.set(rule.id, rule);
		}

		await this.save();
	}

	/**
	 * Save rules to disk
	 */
	async save(): Promise<void> {
		await fs.mkdir(this.rulesDir, { recursive: true });
		
		const rulesArray = Array.from(this.rules.values());
		const rulesFile = path.join(this.rulesDir, 'rules.json');
		
		await fs.writeFile(
			rulesFile,
			JSON.stringify(rulesArray, null, 2),
			'utf-8'
		);
	}

	/**
	 * Add a new rule
	 */
	async addRule(
		name: string,
		description: string,
		content: string,
		tags: string[] = [],
		priority: number = 3
	): Promise<Rule> {
		const rule: Rule = {
			id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
			name,
			description,
			content,
			enabled: true,
			priority,
			tags,
		};

		this.rules.set(rule.id, rule);
		await this.save();
		return rule;
	}

	/**
	 * Update a rule
	 */
	async updateRule(id: string, updates: Partial<Omit<Rule, 'id'>>): Promise<Rule | undefined> {
		const rule = this.rules.get(id);
		if (!rule) {
			return undefined;
		}

		Object.assign(rule, updates);
		await this.save();
		return rule;
	}

	/**
	 * Delete a rule
	 */
	async deleteRule(id: string): Promise<boolean> {
		const deleted = this.rules.delete(id);
		if (deleted) {
			await this.save();
		}
		return deleted;
	}

	/**
	 * Get a specific rule
	 */
	getRule(id: string): Rule | undefined {
		return this.rules.get(id);
	}

	/**
	 * Get all rules
	 */
	getAllRules(): string[] {
		return Array.from(this.rules.values())
			.filter(rule => rule.enabled)
			.sort((a, b) => a.priority - b.priority)
			.map(rule => `[${rule.name}] ${rule.content}`);
	}

	/**
	 * Get rules as structured data
	 */
	getAllRulesData(): Rule[] {
		return Array.from(this.rules.values())
			.sort((a, b) => a.priority - b.priority);
	}

	/**
	 * Get rules by tags
	 */
	getRulesByTags(tags: string[]): Rule[] {
		return Array.from(this.rules.values())
			.filter(rule => 
				rule.enabled && tags.some(tag => rule.tags.includes(tag))
			)
			.sort((a, b) => a.priority - b.priority);
	}

	/**
	 * Enable or disable a rule
	 */
	async toggleRule(id: string, enabled: boolean): Promise<Rule | undefined> {
		const rule = this.rules.get(id);
		if (!rule) {
			return undefined;
		}

		rule.enabled = enabled;
		await this.save();
		return rule;
	}

	/**
	 * Clear all rules
	 */
	async clearAll(): Promise<void> {
		this.rules.clear();
		await this.save();
	}

	/**
	 * Get rules statistics
	 */
	getStats(): { total: number; enabled: number; disabled: number; rulesDir: string } {
		const allRules = Array.from(this.rules.values());
		return {
			total: allRules.length,
			enabled: allRules.filter(r => r.enabled).length,
			disabled: allRules.filter(r => !r.enabled).length,
			rulesDir: this.rulesDir,
		};
	}
}
