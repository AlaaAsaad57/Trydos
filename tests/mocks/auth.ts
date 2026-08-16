export function makeMockAuthModule(){
    return {
        default:{
        RefreshSession:vi.fn(),
        ExpiredUser:vi.fn(),
        UserID:vi.fn()}
    }
}