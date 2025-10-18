import React, { useRef, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { ClineMessage } from '../../shared/ExtensionMessage';

export interface ChatViewProps {
	messages: any[];
	isProcessing: boolean;
}

/**
 * Chat view component displaying conversation messages
 */
export const ChatView: React.FC<ChatViewProps> = ({ messages, isProcessing }) => {
	const scrollRef = useRef<any>(null);

	useEffect(() => {
		// Auto-scroll to bottom when new messages arrive
		if (scrollRef.current) {
			scrollRef.current.scrollToBottom();
		}
	}, [messages]);

	const renderMessage = (message: any, index: number) => {
		const isUser = message.type === 'say' && 
			(message.say === 'task' || message.say === 'user_feedback');
		
		const isAssistant = message.role === 'assistant';
		const isSystem = message.type === 'say' && 
			!['task', 'user_feedback', 'text'].includes(message.say);

		return (
			<Box key={index} flexDirection="column" marginBottom={1}>
				<Box marginBottom={0}>
					<Text bold color={isUser ? 'green' : isAssistant ? 'blue' : 'yellow'}>
						{isUser && '👤 You'}
						{isAssistant && '🤖 Cline'}
						{isSystem && '⚙️  System'}
					</Text>
				</Box>
				
				<Box paddingLeft={2} flexDirection="column">
					{message.text && (
						<Text wrap="wrap">{message.text}</Text>
					)}
					
					{message.say === 'tool' && message.tool && (
						<Box flexDirection="column" marginTop={1}>
							<Text color="cyan" bold>Tool: {message.tool.tool}</Text>
							{message.tool.path && (
								<Text dimColor>Path: {message.tool.path}</Text>
							)}
							{message.tool.diff && (
								<Box borderStyle="single" marginTop={1} padding={1}>
									<Text>{message.tool.diff}</Text>
								</Box>
							)}
						</Box>
					)}

					{message.images && message.images.length > 0 && (
						<Box marginTop={1}>
							<Text dimColor>📎 {message.images.length} image(s) attached</Text>
						</Box>
					)}
				</Box>
			</Box>
		);
	};

	return (
		<Box 
			flexDirection="column" 
			padding={1}
			borderStyle="single"
			borderColor="gray"
			flexGrow={1}
			overflow="hidden"
		>
			{messages.length === 0 ? (
				<Box flexDirection="column" alignItems="center" justifyContent="center">
					<Text bold color="cyan">Welcome to Cline TUI!</Text>
					<Text dimColor>Enter a task below to get started.</Text>
					<Box marginTop={1}>
						<Text dimColor>Examples:</Text>
					</Box>
					<Box paddingLeft={2} flexDirection="column">
						<Text dimColor>• Create a new React component</Text>
						<Text dimColor>• Refactor this function to be more efficient</Text>
						<Text dimColor>• Add tests for the authentication module</Text>
						<Text dimColor>• Review and fix any bugs in app.py</Text>
					</Box>
				</Box>
			) : (
				<Box ref={scrollRef} flexDirection="column">
					{messages.map((msg, idx) => renderMessage(msg, idx))}
					
					{isProcessing && (
						<Box marginTop={1}>
							<Text color="cyan">
								<Spinner type="dots" />
								{' '}Processing...
							</Text>
						</Box>
					)}
				</Box>
			)}
		</Box>
	);
};
