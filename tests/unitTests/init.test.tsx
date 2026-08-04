import { Sum } from "tests/testUtils";

beforeEach(()=>{
    console.log("Before each test");
})
// after each test
afterEach(()=>{
    console.log("After each test");
})

beforeAll(()=>{
    console.log("Before all tests");
})

afterAll(()=>{
    console.log("After all tests");
})

// previous will run before all describe

//we can add this hooks inside the describe block as well, in that case it will run only for that describe block
describe("Init tests",()=>{


    beforeEach(()=>{
        console.log("Before each test in Describe 1");
    })

    describe("nested describe",()=>{
        test("sum not correct",()=>{
            expect(Sum(2,3)).toBe(5);
        })
    })
    test('1+2 should be 3',()=>{
        expect(Sum(1,2)).toBe(3);
    })

})

describe("Init test 2",()=>{

    test('2+2 should be 4',()=>{
        expect(Sum(2,2)).toBeGreaterThan(2);
    })
})

