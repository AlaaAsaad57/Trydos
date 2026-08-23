export function makeToastsMock(){

    return({
    showErrorMessage:vi.fn(),
    showSuccessMessage:vi.fn()})
}