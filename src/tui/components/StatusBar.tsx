import React from 'react';
import { Box, Text } from 'ink';

export interface StatusBarProps {
	cwd: string;
	isProcessing: boolean;
	mcpStatus: Record<string, string>;
}

/**
 * Status bar showing current state
 */
export const StatusBar: React.FC<StatusBarProps> = ({ cwd, isProcessing, mcpStatus }) => {
	const mcpServers = Object.entries(mcpStatus);
	const activeMCP = mcpServers.filter(([_, status]) => status === 'running').length;

	return (
		<Box 
			borderStyle="single" 
			borderColor="gray"
			padding={1}
			marginTop={1}
		>
			<Box width="100%" justifyContent="space-between">
				<Box>
					<Text dimColor>📁 {cwd}</Text>
				</Box>
				
				<Box>
					{isProcessing && (
						<>
							<Text color="yellow">⚡ Processing</Text>
							<Text dimColor> | </Text>
						</>
					)}
					
					{mcpServers.length > 0 && (
						<>
							<Text dimColor>
								MCP: {activeMCP}/{mcpServers.length} active
							</Text>
							<Text dimColor> | </Text>
						</>
					)}
					
					<Text dimColor>Ready</Text>
				</Box>
			</Box>
		</Box>
	);
};
