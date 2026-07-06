import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { HardShadowBox } from '../src/components/HardShadowBox';
import { colors, radii } from '../src/theme/tokens';

describe('HardShadowBox', () => {
  it('renders with default props', async () => {
    const { getByText, getByTestId, toJSON } = await render(
      <HardShadowBox>
        <Text>Memsy</Text>
      </HardShadowBox>,
    );

    expect(getByText('Memsy')).toBeTruthy();
    expect(getByTestId('hard-shadow')).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });

  it('offsets shadow outside content bounds', async () => {
    const { getByTestId, toJSON } = await render(
      <HardShadowBox
        backgroundColor={colors.amberBlast}
        radius={radii.xl}
        offsetX={9}
        offsetY={10}
      />,
    );

    expect(getByTestId('hard-shadow').props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ left: 9, top: 10, right: -9, bottom: -10 }),
      ]),
    );
    expect(getByTestId('hard-shadow-content').props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: colors.amberBlast,
          borderRadius: radii.xl,
        }),
      ]),
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
