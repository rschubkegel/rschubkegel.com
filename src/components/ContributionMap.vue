<template>
	<div class="contribution-map">
		<div ref="chartContainer" class="chart-container">
			<div class="placeholder">
				<span>Loading GitHub contributions...</span>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { createClient, fetchExchange } from '@urql/core'
import * as d3 from 'd3'
import gsap from 'gsap'
import { onMounted, onUnmounted, ref } from 'vue'

interface ContributionDay {
	contributionCount: number;
	date: string;
}

interface Week {
	contributionDays: ContributionDay[];
}

interface ContributionCalendar {
	totalContributions: number;
	weeks: Week[];
}

const INITIALIZE_DEBOUNCE_TIME = 200;

// 2.5 seconds (matches typing header duration)
const TIME_TO_ANIMATE = 1000 * 2.5;

const chartContainer = ref<HTMLElement | null>(null);
const loading = ref(true);
const username = 'rschubkegel';
const initializeTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const isInitialized = ref(false);
const revealTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const overlayHidden = ref(false);

// GraphQL client setup
const client = createClient({
	url: 'https://api.github.com/graphql',
	fetchOptions: () => {
		return {
			headers: {
				Authorization: `Bearer ${import.meta.env.PUBLIC_GITHUB_TOKEN}`,
			},
		};
	},
	exchanges: [fetchExchange],
});

// GraphQL query to fetch contribution data
const query = `
  query($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }
`;

const fetchContributions = async (username: string): Promise<ContributionCalendar | null> => {
	const oneYearAgo = new Date();
	oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
	
	const result = await client.query(query, {
		username,
		from: oneYearAgo.toISOString(),
		to: new Date().toISOString(),
	});
	
	return result.data?.user?.contributionsCollection?.contributionCalendar;
};

const createChart = (data: ContributionCalendar) => {
	if (!chartContainer.value) return;
	
	const width = 634;
	const height = 82;
	const cellSize = 10;
	const cellPadding = 2;
	
	const svg = d3
	.select(chartContainer.value)
	.append('a')
	.attr('href', `https://github.com/${username}`)
	.attr('target', '_blank')
	.append('svg')
	.attr('width', width)
	.attr('height', height)
	.attr('viewBox', `0 0 ${width} ${height}`)
	.style('width', '100%')
	.style('height', 'auto')
	.append('g');
	
	// Create color scale
	const colorScale = d3
	.scaleThreshold<number, string>()
	.domain([5, 10, 15, 20])
	.range([
		'var(--color-github-muted)',
		'var(--color-github-medium)',
		'var(--color-github-dark)',
		'var(--color-github-darker)',
	]);
	
	// Create week groups
	const weekGroups = svg
	.selectAll('.week')
	.data(data.weeks)
	.enter()
	.append('g')
	.attr('class', 'week')
	.attr('transform', (_d: Week, i: number) => `translate(${i * (cellSize + cellPadding)}, 0)`);
	
	// Create day rectangles
	weekGroups
	.selectAll('.day')
	.data((d: Week) => d.contributionDays)
	.enter()
	.append('rect')
	.attr('class', 'day')
	.attr('width', cellSize)
	.attr('height', cellSize)
	.attr('y', (_d: ContributionDay, i: number) => i * (cellSize + cellPadding))
	.attr('fill', (d: ContributionDay) => colorScale(d.contributionCount))
	.attr('rx', 2)
	.append('title')
	.text((d: ContributionDay) => `${d.date}: ${d.contributionCount} contributions`);

	// Animate on click
	chartContainer.value.querySelector<HTMLAnchorElement>('a')?.addEventListener('click', e => {
		e.preventDefault();
		if (revealTimeout.value) clearTimeout(revealTimeout.value);
		animateChart();
	});

	// Set placeholder to absolute and pointer events to none
	gsap.set('.chart-container .placeholder', {
		position: 'absolute',
		inset: 0,
		pointerEvents: 'none',
	});
};

const animateChart = () => {
	if (loading.value) return;
	if (!chartContainer.value) return;

	// Animate placeholder out (only once)
	if (!overlayHidden.value) {
		overlayHidden.value = true;
		gsap.to('.chart-container .placeholder span', {
			opacity: 0,
			overwrite: true,
			duration: 0.9,
			ease: 'power4.out',
		});
		gsap.to('.chart-container .placeholder', {
			opacity: 0,
			overwrite: true,
			duration: 2.8,
			ease: 'power4.out',
		});
	}

	// Animate days in (repeatedly)
	gsap.getById('contribution-map-days')?.revert();
	gsap.from('.chart-container .day', {
		id: 'contribution-map-days',
		opacity: 0,
		scale: 0.3,
		duration: 0.4,
		ease: 'elastic.out(1.2,1)',
		stagger: {
			amount: 1.5,
			from: 'start',
			grid: [52, 7],
			ease: 'none',
		},
	});
};

const _initialize = async () => {
	if (window.innerWidth < 700 || isInitialized.value) return;
	isInitialized.value = true;

	const time = Date.now();
	try {
		const data = await fetchContributions(username);
		if (data) {
			createChart(data);
			requestAnimationFrame(() => {
				const diff = Date.now() - time;
				if (diff > TIME_TO_ANIMATE) {
					animateChart();
				} else {
					revealTimeout.value = setTimeout(() => {
						animateChart();
						revealTimeout.value = null;
					}, TIME_TO_ANIMATE - diff);
				}
			});
		}
	} finally {
		loading.value = false;
	}
}

const initialize = () => {
	if (initializeTimeout.value) clearTimeout(initializeTimeout.value);
	initializeTimeout.value = setTimeout(() => {
		_initialize();
	}, INITIALIZE_DEBOUNCE_TIME);
}

onMounted(() => {
	initialize();
	window.addEventListener('resize', initialize);
});

onUnmounted(() => {
	window.removeEventListener('resize', initialize);
});
</script>

<style scoped>
.contribution-map {
	width: 100%;
	margin-top: calc(var(--spacing) * 1.5)
}

@media (max-width: 700px) {
	.contribution-map {
		display: none;
	}
}

.chart-container {
	width: 100%;
	position: relative;
}

.placeholder {
	width: 100%;
	height: auto;
	aspect-ratio: 634 / 86;
	background-color: color-mix(in srgb, var(--color-github-muted) 25%, var(--color-bg-strong));
	border: 2px solid var(--color-github-muted);
	border-radius: 4px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-style: italic;
	font-weight: 100;
	color: var(--color-github-medium);
}

.day {
	transition: fill 0.2s ease;
}

.day:hover {
	stroke: #000;
	stroke-width: 1;
}
</style> 