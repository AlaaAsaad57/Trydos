const initialState = {products:[
   { colors:[

    {name:'pink',photos:['/images/p1.jpg','/images/p2.jpg','/images/p3.jpg','/images/p1.jpg','/images/p2.jpg','/images/p3.jpg','/images/p1.jpg','/images/p2.jpg','/images/p3.jpg']},
    {name:'yellow',photos:['/images/y1.jpg','/images/y2.jpg','/images/y3.jpg','/images/y1.jpg','/images/y2.jpg','/images/y3.jpg','/images/y1.jpg','/images/y2.jpg','/images/y3.jpg']},
    {name:'red',photos:['/images/r1.jpg','/images/r2.jpg','/images/r3.jpg','/images/r1.jpg','/images/r2.jpg','/images/r3.jpg','/images/r1.jpg','/images/r2.jpg','/images/r3.jpg']},
    {name:'blue',photos:['/images/bl1.jpg','/images/bl2.jpg','/images/bl3.jpg','/images/bl1.jpg','/images/bl2.jpg','/images/bl3.jpg','/images/bl1.jpg','/images/bl2.jpg','/images/bl3.jpg']},
    {name:'green',photos:['/images/g1.jpg','/images/g2.jpg','/images/g3.jpg','/images/g1.jpg','/images/g2.jpg','/images/g3.jpg','/images/g1.jpg','/images/g2.jpg','/images/g3.jpg']},
    {name:'black',photos:['/images/b1.jpg','/images/b2.jpg','/images/b3.jpg','/images/b1.jpg','/images/b2.jpg','/images/b3.jpg','/images/b1.jpg','/images/b2.jpg','/images/b3.jpg']},
    {name:'orange',photos:['/images/o1.jpg','/images/o2.jpg','/images/o3.jpg','/images/o1.jpg','/images/o2.jpg','/images/o3.jpg','/images/o1.jpg','/images/o2.jpg','/images/o3.jpg']},

]}
]}

const ListingReducer=(state = initialState, { type, payload }) => {
  switch (type) {


  default:
    return state
  }
}
export default  ListingReducer