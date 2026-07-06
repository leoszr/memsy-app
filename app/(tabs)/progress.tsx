import { SprintZeroScreen } from '../../src/components/SprintZeroScreen';
import { colors } from '../../src/theme/tokens';
export default function Progress() {
  return (
    <SprintZeroScreen
      title="Progresso"
      subtitle="Streak e métricas depois."
      color={colors.coralFire}
    />
  );
}
