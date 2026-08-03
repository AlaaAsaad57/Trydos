import { expect, test,describe } from 'vitest';

describe("Init tests",()=>{

    test('a should be 10',()=>{
        let c=5,b=5;
        expect(c+b).toEqual(10);
    })
        test('a should be 10',()=>{
        let c=5,b=7;
        expect(c+b).toEqual(12);
    })
})