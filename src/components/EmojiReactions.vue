<template>
	<div class="emoji-reactions" v-if="isConnected && hasPressedLogo">
		<div class="reaction-buttons">
			<button 
				class="reaction-button" 
				@click="sendReaction('🤯')"
				:disabled="!isConnected"
				title="Exploding Brain"
			>
				🤯
			</button>
			<button 
				class="reaction-button" 
				@click="sendReaction('🍞')"
				:disabled="!isConnected"
				title="Bread"
			>
				🍞
			</button>
			<button 
				class="reaction-button" 
				@click="sendReaction('✨')"
				:disabled="!isConnected"
				title="Sparkles"
			>
				✨
			</button>
		</div>
		
		<!-- Container for floating emojis -->
		<div class="floating-emojis" ref="floatingContainer"></div>
	</div>
</template>

<script setup lang="ts">
import { LOGO_PRESS_KEY } from '@lib/globals'
import gsap from 'gsap'
import { io, Socket } from 'socket.io-client'
import { onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{
	/**
	 * Socket.IO server URL
	 */
	socketUrl?: string;
}>();

const isConnected = ref(false);
const floatingContainer = ref<HTMLElement>();
const socket = ref<Socket | null>(null);
const emojiCounter = ref(0);
const hasPressedLogo = ref(false);

// Get socket URL from environment variables
const socketUrl = import.meta.env.PUBLIC_SOCKET_URL;

const connectSocket = () => {
	const url = props.socketUrl || socketUrl;

	if (!url) {
		console.error('No socket URL found');
		return;
	}
	
	try {
		socket.value = io(url, {
			autoConnect: true,
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionAttempts: 5,
			timeout: 20000
		});
		
		socket.value.on('connect', () => {
			isConnected.value = true;
			console.log('Connected to emoji reactions Socket.IO server');
		});
		
		socket.value.on('newReaction', (data: { emoji: string; timestamp?: number }) => {
			if (data.emoji) {
				showFloatingEmoji(data.emoji);
			} else {
				console.warn('Received unknown event:', event);
			}
		});
		
		socket.value.on('disconnect', (reason: string) => {
			isConnected.value = false;
			console.log('Disconnected from emoji reactions Socket.IO server:', reason);
		});
		
		socket.value.on('connect_error', (error: Error) => {
			console.error('Socket.IO connection error:', error);
			isConnected.value = false;
		});
		
	} catch (error) {
		console.error('Failed to connect to Socket.IO:', error);
		isConnected.value = false;
	}
};

const disconnectSocket = () => {
	if (socket.value) {
		socket.value.disconnect();
		socket.value = null;
		isConnected.value = false;
		console.log('Disconnected from Socket.IO server');
	}
};

const sendReaction = (emoji: string) => {
	if (!socket.value || !socket.value.connected) {
		console.warn('Socket.IO not connected, cannot send reaction');
		return;
	}
	
	try {
		socket.value.emit('emojiReaction', {
			emoji: emoji,
			timestamp: Date.now()
		});
	} catch (error) {
		console.error('Error sending emoji reaction:', error);
	}
};

const showFloatingEmoji = (emoji: string) => {
	if (!floatingContainer.value) return;
	
	const id = `emoji-${emojiCounter.value++}`;
	const containerRect = floatingContainer.value.getBoundingClientRect();
	
	// Random horizontal position within the container
	const x = Math.random() * (containerRect.width - 50);
	
	// Create emoji element manually
	const emojiElement = document.createElement('div');
	emojiElement.className = 'floating-emoji';
	emojiElement.textContent = emoji;
	emojiElement.style.cssText = `
		left: ${x}px;
		bottom: 0px;
		position: absolute;
		font-size: 3rem;
		pointer-events: none;
		user-select: none;
		z-index: 1000;
		opacity: 1;
		font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
	`;
	emojiElement.setAttribute('data-emoji-id', id);
	
	// Add to container
	floatingContainer.value.appendChild(emojiElement);
	
	// Set initial transform
	gsap.set(emojiElement, {
		y: 0,
		x: 0,
		scale: 1,
		opacity: 1
	});
	
	// Create floating animation timeline
	const tl = gsap.timeline({
		onComplete: () => {
			// Remove the element from DOM after animation
			if (emojiElement.parentNode) {
				emojiElement.parentNode.removeChild(emojiElement);
			}
		}
	});
	
	// Animate floating up with drift and fade
	tl.to(emojiElement, {
		y: -containerRect.height,
		x: (Math.random() - 0.5) * 100,
		scale: 1.2,
		duration: 1.5,
		ease: 'power3.out'
	})
	.to(emojiElement, {
		opacity: 0,
		scale: 0.8,
		duration: 0.8,
		ease: 'power2.in'
	}, '-=0.5'); // Start fade slightly before reaching top
};

const checkLogoPress = () => {
	const logoPressed = localStorage.getItem(LOGO_PRESS_KEY) === 'true';
	hasPressedLogo.value = logoPressed;
	
	// Connect socket if logo has been pressed
	if (logoPressed && !socket.value) {
		connectSocket();
	} else if (!logoPressed && socket.value) {
		disconnectSocket();
	}
};

const handleStorageChange = (event: StorageEvent) => {
	if (event.key === LOGO_PRESS_KEY) {
		checkLogoPress();
	}
};

onMounted(() => {
	checkLogoPress();
	window.addEventListener('storage', handleStorageChange);
});

onUnmounted(() => {
	window.removeEventListener('storage', handleStorageChange);
	disconnectSocket();
});
</script>

<style lang="scss" scoped>
.emoji-reactions {
	position: fixed;
	bottom: 2rem;
	right: 2rem;
	z-index: 999;
}

.reaction-buttons {
	display: flex;
	gap: 0.5rem;
}

.reaction-button {
	background: var(--color-bg-strong);
	border: 2px solid color-mix(in srgb, var(--color-primary-muted) 50%, transparent);
	border-radius: 50%;
	width: 3rem;
	height: 3rem;
	font-size: 1.5rem;
	cursor: pointer;
	transition: var(--transition);
	display: flex;
	align-items: center;
	justify-content: center;
	outline: none;
	text-shadow: 0 0.05em 0.1em color-mix(in srgb, var(--color-fg-strong) 20%, transparent);
	
	&:hover {
		background: var(--color-primary-muted);
		transform: scale(1.1);
	}
	
	&:active {
		transform: scale(0.95);
	}
	
	&:focus {
		outline: none;
		border-color: var(--color-primary-muted);
		box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.2);
		background: color-mix(in srgb, var(--color-primary-muted) 50%, var(--color-bg-strong));
	}
	
	&:focus:hover:not(:active) {
		background: var(--color-primary-muted);
		transform: scale(1.1);
	}
	
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		
		&:hover {
			transform: none;
			background: var(--color-bg-strong);
		}
		
		&:focus {
			border-color: var(--color-primary-muted);
			box-shadow: none;
		}
	}
}

.floating-emojis {
	--margin: 5rem;
	position: fixed;
	top: var(--margin);
	left: calc(var(--margin) / 2);
	width: calc(100vw - var(--margin));
	height: 100vh;
	pointer-events: none;
	z-index: 1001;

	:deep(.floating-emoji) {
		position: absolute;
		font-size: 3rem;
		pointer-events: none;
		user-select: none;
		text-shadow: 0 0.05em 0.2em color-mix(in srgb, var(--color-fg-strong) 35%, transparent);
	}
}

@media (max-width: 768px) {
	.emoji-reactions {
		bottom: 1rem;
		right: 1rem;
	}
	
	.reaction-button {
		width: 2.5rem;
		height: 2.5rem;
		font-size: 1.2rem;
	}
}
</style>
