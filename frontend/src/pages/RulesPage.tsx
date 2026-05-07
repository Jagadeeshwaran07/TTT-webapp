import React from 'react';

const RULES = [
  {
    section: 'General Conduct',
    items: [
      'Sportsmanship and respectful behavior are mandatory throughout the tournament.',
      'The umpire’s decision is final in all situations.',
      'Players must arrive at least 15 minutes before their scheduled match time and inform the umpire of their presence.',
      'There will be strictly no buffer time for delayed participants. Matches will proceed as scheduled.'
    ]
  },
  {
    section: 'Match Officials',
    items: [
      'Singles matches will have 1 umpire.',
      'Doubles matches will have 2 umpires.'
    ]
  },
  {
    section: 'Equipment',
    items: [
      'Match balls will be provided by the organizers — GKI 3-Star balls.',
      'Players must bring and use their own bats/rackets.'
    ]
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
      'If a player causes the table to move during a rally by touching it with their body or equipment, the point will be awarded to the opponent. Touching the table is allowed as long as the table does not shift or move.'
    ]
  },
  {
    section: 'Service Rules',
    items: [
      'The first server and the starting side of the table for each player/team will be decided through a toss between the players/teams.',
      'For every serve, the ball must be visibly tossed upward into the air. Final judgment rests with the umpire.',
      'The serving hand must remain outside and visible during the serve.',
      'Serves touching the line are considered valid.'
    ]
  },
  {
    section: 'Set & Break Rules',
    items: [
      'Players/teams will switch sides after every set.',
      'The player/team that won the previous set will continue serving first to the opposite side in the next set.',
      'Only water breaks are allowed after each set.'
    ]
  }
];

export default function RulesPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4 text-center">Table Tennis Tournament – Rules & Guidelines</h1>
      {RULES.map((section, idx) => (
        <div key={section.section} className="mb-6">
          <h2 className="text-lg font-semibold mb-2">{idx + 1}. {section.section}</h2>
          <ol className="list-decimal ml-6 space-y-1">
            {section.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
