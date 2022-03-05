import { testFn } from './spec-only';

describe('spec only', () => {
    it('testFn should return null', () => {
        expect(testFn()).toBeNull();
    });
});
