import { looseIdEquals } from './loose-id';

describe('looseIdEquals', () => {
  it('matches loose equality for ids', () => {
    const values = [1, 2, '1', '2', '01', null, undefined, 0, ''];
    values.forEach((a) => {
      values.forEach((b) => {
        // eslint-disable-next-line eqeqeq -- reference behaviour
        expect(looseIdEquals(a, b)).toBe(a == b);
      });
    });
  });
});
