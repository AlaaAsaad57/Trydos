const initialState = {products:[]}

const ListingReducer=(state = initialState, { type, payload }) => {
  switch (type) {
    case "GET_PRODUCTS":{
      return({
        ...state,
        products:payload
      })
    }

  default:
    return state
  }
}
export default  ListingReducer