import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { ConfigManager } from '../config/ConfigManager';
import { ClineCore } from '../core/ClineCore';

export interface SettingsViewProps {
	configManager: ConfigManager;
	clineCore: ClineCore;
}

/**
 * Settings view for configuration management
 */
export const SettingsView: React.FC<SettingsViewProps> = ({ configManager, clineCore }) => {
	const [selectedSection, setSelectedSection] = useState<string>('api');

	const sections = [
		{ label: 'API Configuration', value: 'api' },
		{ label: 'MCP Servers', value: 'mcp' },
		{ label: 'Memory Settings', value: 'memory' },
		{ label: 'Rules Management', value: 'rules' },
		{ label: 'Custom Instructions', value: 'instructions' },
	];

	const renderAPISettings = () => {
		const config = configManager.getAll();
		return (
			<Box flexDirection="column" padding={1}>
				<Text bold color="cyan">API Configuration</Text>
				<Box marginTop={1} flexDirection="column">
					<Text>Provider: <Text color="green">{config.apiProvider || 'Not set'}</Text></Text>
					<Text>Model: <Text color="green">{config.apiModelId || 'Not set'}</Text></Text>
					<Text>API Key: <Text color="green">{config.apiKey ? '***' : 'Not set'}</Text></Text>
				</Box>
				<Box marginTop={1}>
					<Text dimColor>Use 'cline config --set' to update these values</Text>
				</Box>
			</Box>
		);
	};

	const renderMCPSettings = () => {
		const mcpManager = clineCore.getMCPManager();
		const status = mcpManager?.getServersStatus() || {};
		
		return (
			<Box flexDirection="column" padding={1}>
				<Text bold color="cyan">MCP Servers</Text>
				<Box marginTop={1} flexDirection="column">
					{Object.entries(status).length === 0 ? (
						<Text dimColor>No MCP servers configured</Text>
					) : (
						Object.entries(status).map(([name, serverStatus]) => (
							<Box key={name} marginBottom={1}>
								<Text>{name}: </Text>
								<Text color={serverStatus === 'running' ? 'green' : 'yellow'}>
									{serverStatus}
								</Text>
							</Box>
						))
					)}
				</Box>
				<Box marginTop={1}>
					<Text dimColor>Configure MCP servers in your config file</Text>
				</Box>
			</Box>
		);
	};

	const renderMemorySettings = () => {
		const memoryManager = clineCore.getMemoryManager();
		const stats = memoryManager?.getStats();
		
		return (
			<Box flexDirection="column" padding={1}>
				<Text bold color="cyan">Memory Settings</Text>
				<Box marginTop={1} flexDirection="column">
					{stats ? (
						<>
							<Text>Memories: <Text color="green">{stats.count}/{stats.maxMemories}</Text></Text>
							<Text>Storage: <Text dimColor>{stats.storageDir}</Text></Text>
						</>
					) : (
						<Text dimColor>Memory system disabled</Text>
					)}
				</Box>
			</Box>
		);
	};

	const renderRulesSettings = () => {
		const rulesManager = clineCore.getRulesManager();
		const stats = rulesManager?.getStats();
		
		return (
			<Box flexDirection="column" padding={1}>
				<Text bold color="cyan">Rules Management</Text>
				<Box marginTop={1} flexDirection="column">
					{stats ? (
						<>
							<Text>Total Rules: <Text color="green">{stats.total}</Text></Text>
							<Text>Enabled: <Text color="green">{stats.enabled}</Text></Text>
							<Text>Disabled: <Text color="yellow">{stats.disabled}</Text></Text>
							<Text>Storage: <Text dimColor>{stats.rulesDir}</Text></Text>
						</>
					) : (
						<Text dimColor>Rules system disabled</Text>
					)}
				</Box>
			</Box>
		);
	};

	const renderInstructions = () => {
		const config = configManager.getAll();
		return (
			<Box flexDirection="column" padding={1}>
				<Text bold color="cyan">Custom Instructions</Text>
				<Box marginTop={1}>
					{config.customInstructions ? (
						<Text wrap="wrap">{config.customInstructions}</Text>
					) : (
						<Text dimColor>No custom instructions set</Text>
					)}
				</Box>
			</Box>
		);
	};

	return (
		<Box flexDirection="column" padding={1} flexGrow={1}>
			<Box marginBottom={1}>
				<Text bold>Settings</Text>
				<Text dimColor> (Press Esc to return to chat)</Text>
			</Box>
			
			<Box flexDirection="row" flexGrow={1}>
				<Box width={30} borderStyle="single" padding={1} marginRight={1}>
					<SelectInput
						items={sections}
						onSelect={item => setSelectedSection(item.value)}
					/>
				</Box>
				
				<Box flexGrow={1} borderStyle="single">
					{selectedSection === 'api' && renderAPISettings()}
					{selectedSection === 'mcp' && renderMCPSettings()}
					{selectedSection === 'memory' && renderMemorySettings()}
					{selectedSection === 'rules' && renderRulesSettings()}
					{selectedSection === 'instructions' && renderInstructions()}
				</Box>
			</Box>
		</Box>
	);
};
