import React from 'react';
import { Box, Text } from 'ink';
import { ClineCore } from '../core/ClineCore';

export interface HistoryViewProps {
	clineCore: ClineCore;
}

/**
 * History view showing past conversations
 */
export const HistoryView: React.FC<HistoryViewProps> = ({ clineCore }) => {
	const messages = clineCore.getMessages();

	return (
		<Box flexDirection="column" padding={1} flexGrow={1}>
			<Box marginBottom={1}>
				<Text bold>Conversation History</Text>
				<Text dimColor> (Press Esc to return to chat)</Text>
			</Box>
			
			<Box 
				flexDirection="column" 
				borderStyle="single"
				padding={1}
				flexGrow={1}
			>
				{messages.length === 0 ? (
					<Text dimColor>No messages in current conversation</Text>
				) : (
					<Box flexDirection="column">
						{messages.map((msg, idx) => (
							<Box key={idx} marginBottom={1} flexDirection="column">
								<Text dimColor>
									{new Date(msg.ts).toLocaleTimeString()}
								</Text>
								<Text>{msg.text || '[System Message]'}</Text>
							</Box>
						))}
					</Box>
				)}
			</Box>
		</Box>
	);
};
