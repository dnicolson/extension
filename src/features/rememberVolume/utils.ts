import type { YouTubePlayerDiv } from "@/src/types";

import eventManager from "@/src/events/EventManager";
import { registry } from "@/src/features/_registry/featureRegistry";
import { waitForElement } from "@/src/utils/dom/wait";
import { isLivePage, isShortsPage, isWatchPage } from "@/src/utils/url";
const stateAPI = registry.stateManager.getStateAPI("rememberVolume");

let shortsOverrideHandled = false;
let shortsObserver: MutationObserver | null = null;

export function cleanupShortsObserver() {
	if (shortsObserver) {
		shortsObserver.disconnect();
		shortsObserver = null;
	}
}

export async function setupVolumeChangeListener() {
	const IsWatchPage = isWatchPage();
	const IsLivePage = isLivePage();
	const IsShortsPage = isShortsPage();
	shortsOverrideHandled = false;
	const selector = IsShortsPage ? "div#shorts-player" : "div#movie_player";
	// Get the player container element
	const playerContainer = await waitForElement<YouTubePlayerDiv>(IsShortsPage ? "div#shorts-player" : "div#movie_player", 10000);
	if (!playerContainer) return;
	const callback = () => {
		void handleVolumeChange(selector, IsWatchPage, IsLivePage, IsShortsPage);
	};
	if (IsWatchPage || IsLivePage) {
		const videoElement = playerContainer.querySelector<HTMLVideoElement>("div > video");
		if (!videoElement) return;
		eventManager.addEventListener(videoElement, "volumechange", callback, "rememberVolume");
		return;
	}
	if (IsShortsPage) {
		let currentVideo: HTMLVideoElement | null = null;
		const attachVideoListener = () => {
			const container = document.querySelector<YouTubePlayerDiv>(selector);
			if (!container) return;
			const video = container.querySelector<HTMLVideoElement>("div > video");
			if (!video || video === currentVideo) return;
			currentVideo = video;
			eventManager.removeEventListeners("rememberVolume");
			eventManager.addEventListener(video, "volumechange", callback, "rememberVolume");
		};
		attachVideoListener();
		cleanupShortsObserver();
		shortsObserver = new MutationObserver(attachVideoListener);
		shortsObserver.observe(document.body, { childList: true, subtree: true });
	}
}
async function handleVolumeChange(selector: string, isWatch: boolean, isLive: boolean, isShorts: boolean) {
	const player = document.querySelector<YouTubePlayerDiv>(selector);
	if (!player) return;
	const newVolume = await player.getVolume();
	if (isWatch || isLive) {
		stateAPI.setState((prev) => ({ ...prev, watchPageVolume: newVolume }));
	} else if (isShorts) {
		if (!shortsOverrideHandled && newVolume === 100) {
			shortsOverrideHandled = true;
			const { shortsPageVolume: saved } = stateAPI.getState();
			if (saved !== 100) {
				await player.setVolume(saved);
				return;
			}
		}
		stateAPI.setState((prev) => ({ ...prev, shortsPageVolume: newVolume }));
	}
}
