import { BookOpen, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const RULES = [
	{
		section: 'General Conduct',
		items: [
			'Sportsmanship and respectful behavior are mandatory throughout the tournament.',
			'The umpire\'s decision is final in all situations.',
			'Players must arrive at least 15 minutes before their scheduled match time and inform the umpire of their presence.',
			'There will be strictly no buffer time for delayed participants. Matches will proceed as scheduled.',
		],
	},
	{
		section: 'Match Officials',
		items: [
			'Singles matches will have 1 umpire.',
			'Doubles matches will have 2 umpires.',
		],
	},
	{
		section: 'Equipment',
		items: [
			'Match balls will be provided by the organizers — GKI 3-Star balls.',
			'Players must bring and use their own bats/rackets.',
		],
	},
	{
		section: 'Match & Rally Rules',
		items: [
			'If the ball touches the ceiling or any area above the playing zone, the point will be awarded to the opponent.',
			'Edge balls are considered valid points. Side-edge balls will be treated as invalid/no point. The umpire will make the final decision.',
			'Players must continue the rally until the umpire officially calls the point dead or gives a final decision.',
			'Partial hand involvement while returning the ball will be judged by the umpire.',
			'Carrying/lifting the ball during play will be decided by the umpire.',
			'Hand switching during a rally is allowed.',
			'If a player causes the table to move during a rally by touching it with their body or equipment, the point will be awarded to the opponent. Touching the table is allowed as long as the table does not shift or move.',
		],
	},
	{
		section: 'Service Rules',
		items: [
			'The first server and the starting side of the table for each player/team will be decided through a toss between the players/teams.',
			'For every serve, the ball must be visibly tossed upward into the air. Final judgment rests with the umpire.',
			'The serving hand must remain outside and visible during the serve.',
			'Serves touching the line are considered valid.',
		],
	},
	{
		section: 'Set & Break Rules',
		items: [
			'Players/teams will switch sides after every set.',
			'The player/team that won the previous set will continue serving first to the opposite side in the next set.',
			'Only water breaks are allowed after each set.',
		],
	},
];

export default function RulesPage() {
	return (
		<div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
			>
				{/* Header */}
				<div className="mb-10 text-center">
					<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
						<BookOpen size={22} />
					</div>
					<h1 className="text-3xl font-bold tracking-tight text-gray-900">
						Rules & Guidelines
					</h1>
					<p className="mt-2 text-gray-500">
						Official rules for all table tennis tournament matches
					</p>
				</div>

				{/* Sections */}
				<div className="space-y-6">
					{RULES.map((section, idx) => (
						<motion.div
							key={section.section}
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: idx * 0.06 }}
							className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-xs"
						>
							<div className="mb-4 flex items-center gap-3">
								<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-600">
									{idx + 1}
								</span>
								<h2 className="text-lg font-semibold text-gray-900">
									{section.section}
								</h2>
							</div>
							<ul className="space-y-2.5">
								{section.items.map((item, i) => (
									<li key={i} className="flex gap-2.5 text-sm leading-relaxed text-gray-600">
										<ChevronRight size={14} className="mt-1 shrink-0 text-brand-400" />
										<span>{item}</span>
									</li>
								))}
							</ul>
						</motion.div>
					))}
				</div>
			</motion.div>
		</div>
	);
}
