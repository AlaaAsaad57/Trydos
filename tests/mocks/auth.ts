let _refreshPromise: Promise<{
  refreshed: boolean;
  eligible: boolean;
}> | null = null;
export function makeMockAuthModule(){
    return {
        default:{
        RefreshSession:vi.fn(),
        ExpiredUser:vi.fn(),
        UserID:vi.fn()}
    }
}