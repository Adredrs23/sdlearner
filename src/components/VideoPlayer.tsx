'use client';

import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { useEffect, useRef } from 'react';
import Player from 'video.js/dist/types/player';

interface VideoPlayerProps {
	poster?: string;
	sources: {
		src: string;
		label: string; // e.g., '720p', '480p'
		type?: string;
	}[];
}

export default function VideoPlayer({ sources, poster }: VideoPlayerProps) {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const playerRef = useRef<Player | null>(null);

	useEffect(() => {
		if (videoRef.current && !playerRef.current) {
			const player = videojs(videoRef.current, {
				controls: true,
				preload: 'metadata',
				fluid: true,
				responsive: true,
				poster,
			});

			playerRef.current = player;

			// Load the highest resolution by default
			player.src(sources[0]);

			// Wait for player to be ready before adding custom components
			player.ready(() => {
				// Create Quality Selector Menu Button
				const MenuButton = videojs.getComponent('MenuButton');
				const MenuItem = videojs.getComponent('MenuItem');

				class QualityMenuItem extends MenuItem {
					constructor(player: Player, options: any) {
						const label = options.label || '';
						super(
							player,
							Object.assign(options, {
								label,
								selectable: true,
								multiSelectable: false,
							})
						);
						this.source = options.source;
						this.qualityLabel = options.label;
						this.menuButton = options.menuButton;
					}

					handleClick() {
						const player = this.player();
						const currentTime = player.currentTime();
						const isPaused = player.paused();

						// Update source
						player.src(this.source);

						// Wait for the new source to load
						player.one('loadedmetadata', () => {
							player.currentTime(currentTime);
							if (!isPaused) {
								player.play();
							}
						});

						// Update selected state for all menu items
						if (
							this.menuButton &&
							this.menuButton.menu &&
							this.menuButton.menu.children_
						) {
							this.menuButton.menu.children_.forEach((child: any) => {
								if (child !== this && typeof child.selected === 'function') {
									child.selected(false);
									child.removeClass('vjs-selected');
								}
							});
						}

						// Mark this item as selected
						this.selected(true);
						this.addClass('vjs-selected');

						// Update button text to show current quality
						if (
							this.menuButton &&
							typeof this.menuButton.updateButtonText === 'function'
						) {
							this.menuButton.updateButtonText(this.qualityLabel);
						}
					}
				}

				class QualityMenuButton extends MenuButton {
					constructor(player: Player, options: any) {
						super(
							player,
							Object.assign(options, {
								title: 'Quality',
								name: 'QualityMenuButton',
							})
						);
						this.controlText('Quality');
						this.currentQuality = sources[0]?.label || 'Quality';
					}

					createItems() {
						const items: any[] = [];

						sources.forEach((source, index) => {
							const item = new QualityMenuItem(this.player(), {
								label: source.label,
								source: source,
								selected: index === 0, // Select first item by default
								menuButton: this, // Pass reference to menu button
							});
							items.push(item);
						});

						return items;
					}

					buildCSSClass() {
						return 'vjs-quality-button ' + super.buildCSSClass();
					}

					handleClick() {
						// Show current quality in button text before opening menu
						this.updateButtonText(this.currentQuality);
						super.handleClick();
					}

					ready() {
						super.ready();
						// Set initial text after component is ready
						setTimeout(() => {
							this.updateButtonText(this.currentQuality);
						}, 100);
					}

					updateButtonText(qualityLabel: string) {
						this.currentQuality = qualityLabel;

						// Try multiple methods to set the button text
						const el = this.el();
						if (el) {
							// Method 1: Update existing text content
							const existingText = el.querySelector('.vjs-quality-text');
							if (existingText) {
								existingText.textContent = qualityLabel;
								return;
							}

							// Method 2: Create new text element
							let textElement = document.createElement('span');
							textElement.className = 'vjs-quality-text';
							textElement.textContent = qualityLabel;
							textElement.style.cssText = `
								position: absolute;
								top: 50%;
								left: 50%;
								transform: translate(-50%, -50%);
								font-size: 11px;
								font-weight: bold;
								color: white;
								pointer-events: none;
								text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
							`;

							// Add to button element
							el.style.position = 'relative';
							el.appendChild(textElement);
						}
					}
				}

				// Register the components
				videojs.registerComponent('QualityMenuItem', QualityMenuItem as any);
				videojs.registerComponent(
					'QualityMenuButton',
					QualityMenuButton as any
				);

				// Add the quality button to the control bar
				const qualityButton = new QualityMenuButton(player, {});
				player.controlBar.addChild(
					qualityButton,
					{},
					player.controlBar.children().length - 1
				);
			});
		}

		return () => {
			if (playerRef.current) {
				playerRef.current.dispose();
				playerRef.current = null;
			}
		};
	}, [sources, poster]);

	return (
		<div data-vjs-player>
			<video ref={videoRef} className='video-js vjs-big-play-centered' />
		</div>
	);
}
