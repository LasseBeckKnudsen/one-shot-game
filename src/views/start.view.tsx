/** The start screen: logo, the rules and the two ways in. Intents: solo, join. */
import { Widget, defineView } from '@gameengine/ui';

export const StartView = defineView<Record<string, never>>({
  name: 'Start',
  description: 'Logo, colour-coded rules, JOIN GAME and PLAY SOLO vs BOTS. Intents: join, solo, options.',
  samples: { default: {} },
  render: (_model, { intent }) => <Widget doc="start-menu" onIntent={(_, e) => intent(e.path.at(-1)!)} />,
});
