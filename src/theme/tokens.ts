export const colors = {
  gameBlue: '#067bc2',
  sky: '#84bcda',
  amberBlast: '#ecc30b',
  coralFire: '#f37748',
  lobster: '#d56062',
  memsyGreen: '#05a77d',
  navyInk: '#1a1a2e',
  navyInkScrim: 'rgba(26, 26, 46, 0.35)',
  chalkWhite: '#fffdf5',
  bubbleGum: '#ffb3c6',
  mintPop: '#b8f0e0',
} as const;

export const radii = { sm: 8, md: 14, lg: 22, xl: 30, pill: 999 } as const;
export const borders = { hairline: 1, regular: 2.5, chunky: 4 } as const;
export const shadows = {
  hard: { x: 5, y: 6 },
  hardPressed: { x: 2, y: 3 },
} as const;
export const fonts = {
  regular: 'Nunito_400Regular',
  bold: 'Nunito_700Bold',
  black: 'Nunito_900Black',
} as const;
