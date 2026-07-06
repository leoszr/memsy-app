import { SprintZeroScreen } from '../../src/components/SprintZeroScreen';
import { colors } from '../../src/theme/tokens';
export default function Train() {
  return (
    <SprintZeroScreen
      title="Treinar"
      subtitle="Fila de treino vem na Sprint 1."
      color={colors.mintPop}
    />
  );
}
