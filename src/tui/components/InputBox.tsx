import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

export interface InputBoxProps {
	onSubmit: (text: string, images?: string[]) => Promise<void>;
	disabled?: boolean;
}

/**
 * Input box component for user messages
 */
export const InputBox: React.FC<InputBoxProps> = ({ onSubmit, disabled }) => {
	const [input, setInput] = useState('');

	const handleSubmit = async () => {
		if (input.trim() && !disabled) {
			const text = input.trim();
			setInput('');
			await onSubmit(text);
		}
	};

	return (
		<Box 
			borderStyle="round" 
			borderColor="green"
			padding={1}
			marginTop={1}
		>
			<Box width="100%">
				<Text bold color="green">{'>'} </Text>
				<Box flexGrow={1}>
					<TextInput
						value={input}
						onChange={setInput}
						onSubmit={handleSubmit}
						placeholder={disabled ? 'Processing...' : 'Enter your message...'}
						showCursor={!disabled}
					/>
				</Box>
			</Box>
			<Box marginTop={1}>
				<Text dimColor>
					Press Enter to send | @file, @folder, @url for context | Esc for menu
				</Text>
			</Box>
		</Box>
	);
};
