import React from 'react';
import { Box, Text } from 'ink';

export interface HeaderProps {
	currentView: string;
	onViewChange: (view: 'chat' | 'settings' | 'history') => void;
	onNewTask: () => void;
}

/**
 * Header component with navigation and actions
 */
export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, onNewTask }) => {
	return (
		<Box 
			borderStyle="round" 
			borderColor="cyan"
			padding={1}
			marginBottom={1}
		>
			<Box flexDirection="row" justifyContent="space-between" width="100%">
				<Box>
					<Text bold color="cyan">🤖 Cline TUI</Text>
					<Text dimColor> - AI Coding Assistant</Text>
				</Box>
				
				<Box>
					<Text dimColor>
						{currentView === 'chat' && 'Chat'}
						{currentView === 'settings' && 'Settings'}
						{currentView === 'history' && 'History'}
					</Text>
					<Text dimColor> | </Text>
					<Text dimColor>Ctrl+S: Settings | Ctrl+H: History | Ctrl+C: Exit</Text>
				</Box>
			</Box>
		</Box>
	);
};
