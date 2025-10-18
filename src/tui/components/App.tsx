import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { ConfigManager } from '../config/ConfigManager';
import { ClineCore } from '../core/ClineCore';
import { ChatView } from './ChatView';
import { Header } from './Header';
import { InputBox } from './InputBox';
import { StatusBar } from './StatusBar';
import { SettingsView } from './SettingsView';
import { HistoryView } from './HistoryView';

export interface AppProps {
	configManager: ConfigManager;
	clineCore: ClineCore;
	cwd: string;
}

type View = 'chat' | 'settings' | 'history';

/**
 * Main App component for Cline TUI
 */
export const App: React.FC<AppProps> = ({ configManager, clineCore, cwd }) => {
	const { exit } = useApp();
	const [currentView, setCurrentView] = useState<View>('chat');
	const [messages, setMessages] = useState<any[]>([]);
	const [isProcessing, setIsProcessing] = useState(false);

	// Listen to Cline core events
	useEffect(() => {
		const onMessage = (message: any) => {
			setMessages(prev => [...prev, message]);
		};

		const onTaskStarted = () => {
			setIsProcessing(true);
		};

		const onTaskCompleted = () => {
			setIsProcessing(false);
		};

		clineCore.on('message', onMessage);
		clineCore.on('taskStarted', onTaskStarted);
		clineCore.on('taskCompleted', onTaskCompleted);

		return () => {
			clineCore.off('message', onMessage);
			clineCore.off('taskStarted', onTaskStarted);
			clineCore.off('taskCompleted', onTaskCompleted);
		};
	}, [clineCore]);

	// Global keyboard shortcuts
	useInput((input, key) => {
		if (key.ctrl && input === 'c') {
			exit();
		}
		if (key.ctrl && input === 's') {
			setCurrentView('settings');
		}
		if (key.ctrl && input === 'h') {
			setCurrentView('history');
		}
		if (key.escape) {
			setCurrentView('chat');
		}
	});

	const handleSendMessage = async (text: string, images?: string[]) => {
		try {
			if (messages.length === 0) {
				// Start new task
				await clineCore.startTask(text, images);
			} else {
				// Continue existing conversation
				await clineCore.sendMessage(text, images);
			}
		} catch (error) {
			console.error('Error sending message:', error);
		}
	};

	const handleNewTask = () => {
		setMessages([]);
	};

	return (
		<Box flexDirection="column" height="100%">
			<Header 
				currentView={currentView}
				onViewChange={setCurrentView}
				onNewTask={handleNewTask}
			/>
			
			<Box flexGrow={1} flexDirection="column">
				{currentView === 'chat' && (
					<>
						<ChatView 
							messages={messages}
							isProcessing={isProcessing}
						/>
						<InputBox 
							onSubmit={handleSendMessage}
							disabled={isProcessing}
						/>
					</>
				)}
				
				{currentView === 'settings' && (
					<SettingsView 
						configManager={configManager}
						clineCore={clineCore}
					/>
				)}
				
				{currentView === 'history' && (
					<HistoryView 
						clineCore={clineCore}
					/>
				)}
			</Box>
			
			<StatusBar 
				cwd={cwd}
				isProcessing={isProcessing}
				mcpStatus={clineCore.getMCPManager()?.getServersStatus() || {}}
			/>
		</Box>
	);
};
