import { SprintZeroScreen } from '../../src/components/SprintZeroScreen';
import { colors } from '../../src/theme/tokens';
export default function Cards() {
  return (
    <SprintZeroScreen
      title="Meus Cards"
      subtitle="Deck entra nas próximas sprints."
      color={colors.sky}
    />
  );
}
